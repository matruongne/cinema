const ShowDate = require('../../models/showdate.model')
const Showtime = require('../../models/showtime.model')
const { REDIS_GET, REDIS_SETEX, REDIS_DEL, REDIS_KEYS } = require('../redisServices/redis.service')

class ShowDateService {
	async addShowDate({ movieId, showDate }) {
		try {
			// Kiểm tra đã tồn tại chưa
			let existing = await ShowDate.findOne({
				where: {
					movie_id: movieId,
					show_date: showDate,
				},
			})

			// Nếu chưa có thì tạo mới
			if (!existing) {
				existing = await ShowDate.create({
					movie_id: movieId,
					show_date: showDate,
				})
			}

			const cacheKey = `showdate:${existing.show_date_id}`
			await REDIS_SETEX(cacheKey, 86400, JSON.stringify(existing))

			const pattern = 'showdates:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const pattern2 = 'theater:*'
			const keys2 = await REDIS_KEYS(pattern2)

			for (const key of keys2) {
				await REDIS_DEL(key)
			}

			return existing
		} catch (error) {
			console.error(`[Add Show Date] Error:`, error.message)
			throw new Error(error.message || 'Failed to add show date.')
		}
	}

	async getShowDate({ showDateId }) {
		const cacheKey = `showdate:${showDateId}`

		try {
			const cachedShowDate = await REDIS_GET(cacheKey)
			if (cachedShowDate) {
				return JSON.parse(cachedShowDate)
			}

			const showDateData = await ShowDate.findByPk(showDateId, {
				include: [
					{
						model: Showtime,
						attributes: ['showtime_id', 'show_time', 'available_seats'],
					},
				],
			})

			if (!showDateData) {
				throw new Error('Show date not found.')
			}

			await REDIS_SETEX(cacheKey, 86400, JSON.stringify(showDateData))

			return showDateData
		} catch (error) {
			console.error(`[Get Show Date] Error:`, error.message)
			throw new Error(error.message || 'Failed to get show date.')
		}
	}

	async getAllShowDatesByMovie({ movieId }) {
		const cacheKey = `showdates:movie:${movieId}`

		try {
			const cachedShowDates = await REDIS_GET(cacheKey)
			if (cachedShowDates) {
				return JSON.parse(cachedShowDates)
			}

			const showDates = await ShowDate.findAll({
				where: { movie_id: movieId },
				include: [
					{
						model: Showtime,
						attributes: ['showtime_id', 'show_time'],
					},
				],
				order: [['show_date', 'ASC']],
			})

			if (!showDates || showDates.length === 0) {
				throw new Error('No show dates found for the given movie.')
			}

			await REDIS_SETEX(cacheKey, 86400, JSON.stringify(showDates))

			return showDates
		} catch (error) {
			console.error(`[Get All Show Dates By Movie] Error:`, error.message)
			throw new Error(error.message || 'Failed to fetch show dates.')
		}
	}

	async updateShowDate({ showDateId, ShowDateUpdate }) {
		const cacheKey = `showdate:${showDateId}`

		try {
			const existingShowDate = ShowDate.findByPk(showDateId)
			const { showDate, movieId } = ShowDateUpdate
			if (!existingShowDate) {
				throw new Error('Show date not found.')
			}

			const showDateUpdated = await ShowDate.update(
				{ show_date: showDate, movie_id: movieId },
				{ where: { show_date_id: showDateId } }
			)
			const updatedShowDate = {
				...existingShowDate,
				show_date: showDate,
				movie_id: movieId,
			}
			await REDIS_SETEX(cacheKey, 86400, JSON.stringify(updatedShowDate))

			return showDateUpdated
		} catch (error) {
			console.error(`[Update Show Date] Error:`, error.message)
			throw new Error(error.message || 'Failed to update show date.')
		}
	}

	async deleteShowDate({ showDateId }) {
		const cacheKey = `showdate:${showDateId}`

		try {
			const existingShowDate = ShowDate.findByPk(showDateId)

			if (!existingShowDate) {
				throw new Error('Show date not found.')
			}

			await ShowDate.destroy({ where: { show_date_id: showDateId } })

			await REDIS_DEL(cacheKey)

			return { message: 'Show date deleted successfully.' }
		} catch (error) {
			console.error(`[Delete Show Date] Error:`, error.message)
			throw new Error(error.message || 'Failed to delete show date.')
		}
	}
}

module.exports = new ShowDateService()
