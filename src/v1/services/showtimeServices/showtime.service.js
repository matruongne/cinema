const Screen = require('../../models/screen.model')
const ScreenShowtime = require('../../models/screenShowtime.model')
const Showtime = require('../../models/showtime.model')
const { REDIS_SETEX, REDIS_DEL } = require('../redisServices/redis.service')

class ShowTimeService {
	async addShowtime({ showDateId, screenId, showTime }) {
		try {
			// Lấy các suất chiếu đã gán với screen này trong cùng ngày
			const existingShowtimes = await ScreenShowtime.findAll({
				where: { screen_id: screenId },
				include: {
					model: Showtime,
					where: { show_date_id: showDateId }, // chỉ cùng ngày mới kiểm tra
				},
			})
			// Kiểm tra giờ không trùng hoặc quá gần (< 3 giờ)
			const newTime = new Date(`1970-01-01T${showTime}:00`)
			for (const item of existingShowtimes) {
				const existingTime = new Date(`1970-01-01T${item.Showtime.show_time}`)
				const diff = Math.abs(existingTime - newTime) / (1000 * 60 * 60)

				if (diff < 3) {
					throw new Error(
						`Giờ ${showTime} cách quá gần giờ ${item.Showtime.show_time} (${diff.toFixed(
							1
						)}h) vào cùng ngày.`
					)
				}
			}

			// Tạo hoặc lấy showtime
			let ShowtimeAdd = await Showtime.findOne({
				where: {
					show_date_id: showDateId,
					show_time: showTime,
				},
			})
			if (!ShowtimeAdd) {
				ShowtimeAdd = await Showtime.create({
					show_date_id: showDateId,
					show_time: showTime,
				})
			}

			// Kiểm tra đã liên kết chưa
			const existsLink = await ScreenShowtime.findOne({
				where: {
					screen_id: screenId,
					showtime_id: ShowtimeAdd.showtime_id,
				},
			})
			if (!existsLink) {
				await ScreenShowtime.create({
					screen_id: screenId,
					showtime_id: ShowtimeAdd.showtime_id,
				})
			}

			const cacheKey = `showtimes:${showDateId}`
			await REDIS_SETEX(cacheKey, 86400, JSON.stringify(ShowtimeAdd))

			return ShowtimeAdd
		} catch (error) {
			console.error('[Add Showtime] Error:', error.message)
			throw new Error(error.message || 'Failed to add showtime.')
		}
	}

	async updateShowtime({ showtimeId, showTimeUpdate }) {
		const cacheKey = `showtime:${showtimeId}`

		try {
			const existingShowtime = await Showtime.findByPk(showtimeId)
			const { showTime } = showTimeUpdate
			if (!existingShowtime) {
				throw new Error('Showtime not found.')
			}

			const showtimeUpdated = await Showtime.update(
				{ show_time: showTime },
				{ where: { showtime_id: showtimeId } }
			)

			const updatedShowTime = {
				...existingShowtime,
				show_time: showTime,
			}
			await REDIS_SETEX(cacheKey, 86400, JSON.stringify(updatedShowTime))

			return showtimeUpdated
		} catch (error) {
			console.error('[Update Showtime] Error:', error.message)
			throw new Error('Failed to update showtime.')
		}
	}

	async deleteShowtime({ showtimeId }) {
		const cacheKey = `showtime:${showtimeId}`

		try {
			const showtime = await Showtime.findByPk(showtimeId)
			if (!showtime) {
				throw new Error('Showtime not found.')
			}

			// Xóa showtime
			await Showtime.destroy({ where: { showtime_id: showtimeId } })

			// Xóa cache
			await REDIS_DEL(cacheKey)

			return { message: 'Showtime deleted successfully.' }
		} catch (error) {
			console.error('[Delete Showtime] Error:', error.message)
			throw new Error('Failed to delete showtime.')
		}
	}
}

module.exports = new ShowTimeService()
