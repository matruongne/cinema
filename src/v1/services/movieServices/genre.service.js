const { Op } = require('sequelize')
const Genre = require('../../models/genre.model')
const { REDIS_GET, REDIS_SETEX, REDIS_DEL, REDIS_KEYS } = require('../redisServices/redis.service')

class genreService {
	async getAllGenres({ sortBy = 'genre_name', orderBy = 'ASC', filters = {} }) {
		try {
			const cacheKey = `genres:all:${sortBy}:${orderBy}:${JSON.stringify(filters)}`
			const cachedGenres = await REDIS_GET(cacheKey)

			if (cachedGenres) {
				console.log('Cache hit: Genres')
				return JSON.parse(cachedGenres)
			}

			console.log('Cache miss: Genres')

			const queryOptions = {
				where: filters,
				order: [[sortBy, orderBy.toUpperCase()]],
			}

			const genres = await Genre.findAll(queryOptions)

			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(genres))
			return genres
		} catch (error) {
			throw new Error(error.message || 'Failed to fetch genres.')
		}
	}

	async getGenreById({ genreId }) {
		try {
			const cacheKey = `genre:${genreId}`
			let genre = await REDIS_GET(cacheKey)

			if (genre) {
				console.log('Cache hit:', cacheKey)
				return JSON.parse(genre)
			}

			console.log('Cache miss:', cacheKey)

			genre = await Genre.findByPk(genreId)

			if (!genre) {
				throw new Error('Genre not found.')
			}

			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(genre))

			return genre
		} catch (error) {
			throw new Error(error.message || `Failed to get genre ${genreId}.`)
		}
	}

	async createGenre(genreData) {
		try {
			if (!genreData.genre_name) {
				throw new Error('Genre name is required.')
			}

			const existingGenre = await Genre.findOne({ where: { genre_name: genreData.genre_name } })
			if (existingGenre) {
				throw new Error('A genre with this name already exists.')
			}

			const newGenre = await Genre.create(genreData)

			const cacheKey = `genre:${newGenre.genre_id}`
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(newGenre))

			const pattern = 'genres:all:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			return newGenre
		} catch (error) {
			throw new Error(error.message || 'Failed to create genre.')
		}
	}

	async updateGenre({ genreId, updateData }) {
		try {
			const genre = await Genre.findByPk(genreId)
			if (!genre) {
				throw new Error('Genre not found.')
			}

			if (updateData.genre_name) {
				const existingGenre = await Genre.findOne({
					where: { genre_name: updateData.genre_name, genre_id: { [Op.ne]: genreId } },
				})
				if (existingGenre) {
					throw new Error('A genre with this name already exists.')
				}
			}

			const updatedGenre = await genre.update(updateData)

			const cacheKey = `genre:${genreId}`
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(updatedGenre))

			const pattern = 'genres:all:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			return updatedGenre
		} catch (error) {
			throw new Error(error.message || 'Failed to update genre.')
		}
	}

	async deleteGenre({ genreId }) {
		try {
			const genre = await Genre.findByPk(genreId)
			if (!genre) {
				throw new Error('Genre not found.')
			}

			await genre.destroy()

			const cacheKey = `genre:${genreId}`
			await REDIS_DEL(cacheKey)

			const pattern = 'genres:all:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			return { message: 'Genre deleted successfully.' }
		} catch (error) {
			throw new Error(error.message || 'Failed to delete genre.')
		}
	}
}

module.exports = new genreService()
