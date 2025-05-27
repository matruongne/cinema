const { Op } = require('sequelize')
const Screen = require('../../models/screen.model')
const { REDIS_DEL, REDIS_SETEX, REDIS_KEYS, REDIS_GET } = require('../redisServices/redis.service')
const ScreenShowtime = require('../../models/screenShowtime.model')
const Showtime = require('../../models/showtime.model')
const Movie = require('../../models/movie.model')
const ShowDate = require('../../models/showdate.model')

class screenService {
	async createScreen({ theaterId, screenName }) {
		if (!theaterId || !screenName) {
			throw new Error('Theater ID and Screen Name are required.')
		}

		try {
			const screen = await Screen.create({
				theater_id: theaterId,
				screen_name: screenName,
			})

			const pattern = 'screens:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const cacheKey = `screen:${screen.screen_id}`
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(screen))

			return screen
		} catch (error) {
			console.error('Error creating screen:', error.message)
			throw new Error('Could not create screen.')
		}
	}

	async updateScreen({ screenId, screenUpdates }) {
		try {
			const screen = await Screen.findByPk(screenId)
			if (!screen) throw new Error(`Screen with ID ${screenId} not found.`)

			await screen.update({ screen_name: screenUpdates.screenName, ...screenUpdates })

			const pattern = 'screens:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const cacheKey = `screen:${screen.screen_id}`
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(screen))

			return screen
		} catch (error) {
			console.error('Error updating screen:', error.message)
			throw new Error('Could not update screen.')
		}
	}

	async deleteScreen({ screenId }) {
		try {
			const screen = await Screen.findByPk(screenId)
			if (!screen) throw new Error(`Screen with ID ${screenId} not found.`)

			await screen.destroy()

			const pattern = 'screens:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const cacheKey = `screen:${screenId}`
			await REDIS_DEL(cacheKey)

			return { success: true, message: 'Screen deleted successfully.' }
		} catch (error) {
			console.error('Error deleting screen:', error.message)
			throw new Error('Could not delete screen.')
		}
	}

	async getScreens({
		theaterId,
		search = '',
		sort = 'screen_name',
		order = 'ASC',
		page = 1,
		limit = 10,
	}) {
		if (!theaterId) {
			throw new Error('theater ID is required.')
		}
		const offset = (page - 1) * limit
		const cacheKey = `screens:${theaterId}:${search}:${sort}:${order}:${page}:${limit}`

		try {
			const cachedData = await REDIS_GET(cacheKey)
			if (cachedData) {
				console.log('Cache hit for screens')
				return JSON.parse(cachedData)
			}

			const screens = await Screen.findAndCountAll({
				where: {
					theater_id: theaterId,
					screen_name: { [Op.like]: `%${search}%` },
				},
				order: [[sort, order.toUpperCase()]],
				offset,
				limit,
			})

			const response = {
				totalItems: screens.count,
				totalPages: Math.ceil(screens.count / limit),
				currentPage: page,
				items: screens.rows,
			}

			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(response))

			return response
		} catch (error) {
			console.error('Error fetching screens:', error.message)
			throw new Error('Could not fetch screens.')
		}
	}

	async getShowtimesByScreen({ screenId }) {
		try {
			const screenShowtimes = await ScreenShowtime.findAll({
				where: { screen_id: screenId },
				include: [
					{
						model: Showtime,
						include: [
							{
								model: ShowDate,
								include: [Movie],
							},
						],
					},
				],
				order: [
					[{ model: Showtime }, { model: ShowDate }, 'show_date', 'ASC'],
					[{ model: Showtime }, 'show_time', 'ASC'],
				],
			})

			const result = screenShowtimes.map(s => ({
				showtime_id: s.showtime_id,
				show_date: s.Showtime.ShowDate.show_date,
				show_time: s.Showtime.show_time,
				movie_name: s.Showtime.ShowDate.Movie.title,
				movie_id: s.Showtime.ShowDate.Movie.movie_id,
				showdate_id: s.Showtime.ShowDate.show_date_id,
			}))

			return result
		} catch (error) {
			console.error('Error get Showtimes of screen:', error.message)
			throw new Error('Could not get Showtimes of screen.')
		}
	}
}

module.exports = new screenService()
