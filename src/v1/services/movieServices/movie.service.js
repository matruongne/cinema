const { Op, fn, col, where } = require('sequelize')
const Actor = require('../../models/actor.model')
const Genre = require('../../models/genre.model')
const Movie = require('../../models/movie.model')
const { REDIS_GET, REDIS_SETEX, REDIS_DEL, REDIS_KEYS } = require('../redisServices/redis.service')
const ScreenShowtime = require('../../models/screenShowtime.model')
const Showtime = require('../../models/showtime.model')
const ShowDate = require('../../models/showdate.model')
const Screen = require('../../models/screen.model')

function normalize(str) {
	return str
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D')
		.toLowerCase()
}

class movieService {
	async getMovies({ search = '', sort = 'title', order = 'ASC', page = 1, limit = 10 }) {
		try {
			const offset = (page - 1) * limit
			const cacheKey = `movies:${search}:${sort}:${order}:${page}:${limit}`
			const cachedMovies = JSON.parse(await REDIS_GET(cacheKey))

			if (cachedMovies) {
				console.log('Cache hit: Movies')
				return cachedMovies
			}
			console.log('Cache miss: Movies')
			const movies = await Movie.findAndCountAll({
				distinct: true, // Loại bỏ trùng lặp
				col: 'movie_id',
				include: [
					{ model: Genre, attributes: ['genre_id', 'genre_name'], through: { attributes: [] } },
					{ model: Actor, attributes: ['actor_id', 'name'], through: { attributes: ['role'] } },
				],
				where: {
					[Op.or]: [
						{ title: { [Op.like]: `%${search}%` } },
						{ description: { [Op.like]: `%${search}%` } },
						{ director: { [Op.like]: `%${search}%` } },
					],
				},
				order: [[sort, order.toUpperCase()]],
				limit,
				offset,
			})

			const response = {
				totalItems: movies.count,
				totalPages: Math.ceil(movies.count / limit),
				currentPage: page,
				items: movies.rows,
			}

			// Cache the response
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(response))
			return response
		} catch (error) {
			console.error('Error in fetch movies:', error.message)

			throw new Error('Failed to fetch movies.')
		}
	}

	async createMovie({
		title,
		description,
		release_date,
		duration,
		director,
		language,
		poster_url,
		trailer_url,
		genres,
		actors,
		cast_json,
	}) {
		try {
			const newMovie = await Movie.create({
				title,
				description,
				release_date,
				duration,
				director,
				language,
				poster_url,
				trailer_url,
				cast_json,
			})

			if (genres?.length) {
				const genreInstances = await Genre.findAll({ where: { genre_id: genres } })
				if (genreInstances.length !== genres.length) {
					throw new Error('One or more genres are invalid.')
				}
				await newMovie.addGenres(genreInstances)
			}

			if (actors?.length) {
				for (const actor of actors) {
					const { actor_id, role } = actor
					const actorInstance = await Actor.findByPk(actor_id)
					if (!actorInstance) {
						throw new Error(`Actor with ID ${actor_id} not found.`)
					}
					await newMovie.addActor(actorInstance, { through: { role } })
				}
			}

			const pattern = 'movies:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const cacheKey = `movie:${newMovie.movie_id}`
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(newMovie))

			return newMovie
		} catch (error) {
			console.error('Error in create:', error.message)

			throw new Error('Failed to create movie.')
		}
	}

	async updateMovie({ movieId, updates }) {
		try {
			const { genres, actors, ...movieUpdates } = updates

			const movie = await Movie.findByPk(movieId)
			if (!movie) {
				throw new Error(`Movie with ID ${movieId} not found.`)
			}

			await movie.update(movieUpdates)

			if (genres?.length) {
				const genreInstances = await Genre.findAll({ where: { genre_id: genres } })
				if (genreInstances.length !== genres.length) {
					throw new Error('One or more genres are invalid.')
				}
				await movie.setGenres(genreInstances)
			}

			if (actors?.length) {
				const actorInstances = []
				for (const actor of actors) {
					const { actor_id, role } = actor
					const actorInstance = await Actor.findByPk(actor_id)
					if (!actorInstance) {
						throw new Error(`Actor with ID ${actor_id} not found.`)
					}
					actorInstances.push({ actorInstance, role })
				}

				await movie.setActors([])

				for (const { actorInstance, role } of actorInstances) {
					await movie.addActor(actorInstance, { through: { role } })
				}
			}

			const pattern = 'movies:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const cacheKey = `movie:${movieId}`
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(movie))

			return movie
		} catch (error) {
			console.error('Error in update:', error.message)

			throw new Error('Failed to update movie.')
		}
	}

	async deleteMovie({ movieId }) {
		try {
			const movie = await Movie.findByPk(movieId)
			if (!movie) {
				throw new Error(`Movie with ID ${movieId} not found.`)
			}

			await movie.destroy()

			const pattern = 'movies:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			await REDIS_DEL(`movie:${movieId}`)

			return { message: 'Movie deleted successfully.' }
		} catch (error) {
			console.error('Error in deleteMovie:', error.message)
			throw new Error('Failed to delete movie.')
		}
	}

	async getMovieById({ movieId }) {
		try {
			const cacheKey = `movie:${movieId}`
			const cachedMovie = JSON.parse(await REDIS_GET(cacheKey))

			if (cachedMovie) {
				console.log('Cache hit: Movie')
				return cachedMovie
			}

			console.log('Cache miss: Movie')

			const movie = await Movie.findByPk(movieId, {
				include: [
					{ model: Genre, attributes: ['genre_id', 'genre_name'], through: { attributes: [] } },
					{ model: Actor, attributes: ['actor_id', 'name'], through: { attributes: ['role'] } },
				],
			})

			if (!movie) {
				throw new Error(`Movie with ID ${movieId} not found.`)
			}
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(movie))
			return movie
		} catch (error) {
			console.error('Error in fetch movie:', error.message)

			throw new Error('Failed to fetch movie.')
		}
	}

	async getNowShowingMoviesByTheater({ theaterId }) {
		const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
		const currentTime = new Date().toTimeString().split(' ')[0] // HH:MM:SS

		const screens = await Screen.findAll({
			where: { theater_id: theaterId },
			attributes: ['screen_id'],
		})
		const screenIds = screens.map(s => s.screen_id)
		if (screenIds.length === 0) return []

		const screenShowtimes = await ScreenShowtime.findAll({
			where: { screen_id: { [Op.in]: screenIds } },
			attributes: ['showtime_id'],
		})
		const showtimeIds = screenShowtimes.map(s => s.showtime_id)
		if (showtimeIds.length === 0) return []

		const showtimes = await Showtime.findAll({
			where: {
				showtime_id: { [Op.in]: showtimeIds },
			},
			include: [
				{
					model: ShowDate,
					required: true,
					where: {
						[Op.or]: [
							{ show_date: { [Op.gt]: today } },
							{
								show_date: today,
								'$Showtime.show_time$': { [Op.gt]: currentTime },
							},
						],
					},
					include: [
						{
							model: Movie,
							where: {
								release_date: { [Op.lte]: today },
							},
							attributes: ['movie_id', 'title', 'poster_url', 'release_date', 'duration', 'rating'],
						},
					],
				},
			],
		})

		const movieMap = new Map()
		for (const showtime of showtimes) {
			const movie = showtime.ShowDate?.Movie
			if (movie && !movieMap.has(movie.movie_id)) {
				movieMap.set(movie.movie_id, movie)
			}
		}

		return Array.from(movieMap.values())
	}

	async getNowShowingMoviesByTheaterGrouped({ theaterId }) {
		const today = new Date().toISOString().split('T')[0]
		const currentTime = new Date().toTimeString().split(' ')[0]

		const screens = await Screen.findAll({
			where: { theater_id: theaterId },
			attributes: ['screen_id'],
		})
		const screenIds = screens.map(s => s.screen_id)
		if (screenIds.length === 0) return []

		const screenShowtimes = await ScreenShowtime.findAll({
			where: { screen_id: { [Op.in]: screenIds } },
			attributes: ['showtime_id'],
		})
		const showtimeIds = screenShowtimes.map(s => s.showtime_id)
		if (showtimeIds.length === 0) return []

		const showtimes = await Showtime.findAll({
			where: {
				showtime_id: { [Op.in]: showtimeIds },
			},
			include: [
				{
					model: ShowDate,
					required: true,
					where: {
						[Op.or]: [
							{ show_date: { [Op.gt]: today } },
							{
								show_date: today,
								'$Showtime.show_time$': { [Op.gte]: currentTime },
							},
						],
					},
					include: [
						{
							model: Movie,
							where: { release_date: { [Op.lte]: today } },
							include: [
								{
									model: Genre,
									attributes: ['genre_id', 'genre_name'],
									through: { attributes: [] },
								},
								{
									model: Actor,
									attributes: ['actor_id', 'name'],
									through: { attributes: ['role'] },
								},
							],
						},
					],
				},
			],
		})

		const grouped = {}

		for (const showtime of showtimes) {
			const showDate = showtime.ShowDate?.show_date
			const movie = showtime.ShowDate?.Movie
			const time = showtime.show_time

			if (!showDate || !movie || !time) continue

			if (!grouped[showDate]) {
				grouped[showDate] = new Map()
			}

			const movieData = grouped[showDate].get(movie.movie_id)

			if (movieData) {
				movieData.showtimes.push(time)
			} else {
				grouped[showDate].set(movie.movie_id, {
					...movie.toJSON(),
					showtimes: [time],
				})
			}
		}

		// Trả về array, sắp xếp theo ngày
		const result = Object.entries(grouped)
			.map(([show_date, movieMap]) => ({
				show_date,
				movies: Array.from(movieMap.values()).map(m => ({
					...m,
					showtimes: m.showtimes.sort(),
				})),
			}))
			.sort((a, b) => a.show_date.localeCompare(b.show_date))

		return result
	}

	async searchMovies(keyword = '') {
		const normalizedKeyword = normalize(keyword)

		const results = await Movie.findAll({
			include: [
				{
					model: Genre,
					through: { attributes: [] },
					required: false,
				},
				{
					model: Actor,
					through: { attributes: ['role'] },
					required: false,
				},
			],
			where: {
				[Op.or]: [
					where(fn('LOWER', fn('REPLACE', col('Movie.title'), 'đ', 'd')), {
						[Op.like]: `%${normalizedKeyword}%`,
					}),

					where(fn('LOWER', fn('REPLACE', col('Genres.genre_name'), 'đ', 'd')), {
						[Op.like]: `%${normalizedKeyword}%`,
					}),

					where(fn('LOWER', fn('REPLACE', col('Actors.name'), 'đ', 'd')), {
						[Op.like]: `%${normalizedKeyword}%`,
					}),
				],
			},
			order: [['created_at', 'DESC']],
		})
		return results
	}
}

module.exports = new movieService()
