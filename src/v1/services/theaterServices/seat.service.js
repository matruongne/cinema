const { Op } = require('sequelize')
const ScreenSeat = require('../../models/screenSeat.model')
const { REDIS_DEL, REDIS_SETEX, REDIS_GET, REDIS_KEYS } = require('../redisServices/redis.service')
const Screen = require('../../models/screen.model')

class seatService {
	async createSeatsBatch({ screenId: screen_id, layout, rows = 10, columns = 10 }) {
		if (!screen_id || !layout || rows <= 0 || columns <= 0) {
			throw new Error('Invalid screen_id, layout, rows or columns.')
		}

		const layouts = {
			trapezoidal: {
				vipRows: [2, 3],
				duplexRow: rows - 1,
				vipColumns: Array.from({ length: Math.floor(columns / 1.5) }, (_, index) => {
					// Tính toán cột VIP sẽ nằm ở giữa
					const startColumn = Math.floor((columns - Math.floor(columns / 1.5)) / 2)
					if (startColumn % 2 === 0) return startColumn + index + 1
					else return startColumn + index
				}),
				duplexColumns: Array.from({ length: Math.floor(columns / 2) }, (_, index) => index * 2 + 1),
				rowSeats: row => Math.max(columns - row, 2), // Hàng gần màn hình ít ghế hơn
			},
			bow_shaped: {
				vipRows: [2, 3],
				duplexRow: rows - 1,
				vipColumns: Array.from({ length: Math.floor(columns / 1.5) }, (_, index) => {
					// Tính toán cột VIP sẽ nằm ở giữa
					const startColumn = Math.floor((columns - Math.floor(columns / 1.5)) / 2)
					if (startColumn % 2 === 0) return startColumn + index + 1
					else return startColumn + index
				}),
				duplexColumns: Array.from({ length: Math.floor(columns / 2) }, (_, index) => index * 2 + 1),
				rowSeats: row => {
					// Càng xa màn hình, số ghế càng ít
					const totalSeats = Math.floor(columns - Math.abs(row - Math.floor(rows / 2)) * 2)
					return Math.max(totalSeats, 4) // Giảm số ghế từ giữa ra ngoài
				},
			},
			'3_zones': {
				vipRows: [2, 3],
				duplexRow: rows - 1,
				vipColumns: Array.from({ length: Math.floor(columns / 1.5) }, (_, index) => {
					// Tính toán cột VIP sẽ nằm ở giữa
					const startColumn = Math.floor((columns - Math.floor(columns / 1.5)) / 2)
					if (startColumn % 2 === 0) return startColumn + index + 1
					else return startColumn + index
				}),
				duplexColumns: Array.from(
					{ length: Math.floor(columns / 1.5) },
					(_, index) => index * 2 + 1
				),
				rowSeats: row => {
					return columns
				},
			},
		}

		if (!layouts[layout]) {
			throw new Error('Invalid layout type.')
		}

		const { vipRows, duplexRow, vipColumns, duplexColumns, rowSeats } = layouts[layout]
		const seats = []

		for (let row = 0; row < rows; row++) {
			const seatRow = String.fromCharCode(65 + row)
			const numColumnsInRow = rowSeats(row) // Lấy số cột theo layout cho mỗi hàng

			for (let col = 1; col <= numColumnsInRow; col++) {
				const temp = col
				let seatType = 'NORMAL'

				if (vipRows.includes(row) && vipColumns.includes(col)) {
					seatType = 'VIP'
				}
				if (row === duplexRow && duplexColumns.includes(col)) {
					seatType = 'DUPLEX'

					if (col < numColumnsInRow) ++col
				}

				seats.push({
					screen_id,
					seat_row: seatRow,
					seat_number: temp,
					seat_type: seatType,
				})
			}
		}

		try {
			const createdSeats = await ScreenSeat.bulkCreate(seats, { ignoreDuplicates: true })

			await Screen.update({ layout }, { where: { screen_id } })

			const pattern = `screenSeats:${screen_id}:*`
			const keys = await REDIS_KEYS(pattern)
			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const seat = await Screen.findByPk(screen_id)

			const pattern_2 = `screens:${seat.theater_id}:*`
			const keys_2 = await REDIS_KEYS(pattern_2)
			for (const key of keys_2) {
				await REDIS_DEL(key)
			}

			return createdSeats
		} catch (error) {
			console.error('Error creating seats batch:', error.message)
			throw new Error('Could not create seats batch.')
		}
	}

	async updateSeat({ seat_id, seatUpdates }) {
		try {
			const seat = await ScreenSeat.findByPk(seat_id)
			if (!seat) {
				throw new Error(`Seat with ID ${seat_id} not found.`)
			}
			const { seatType } = seatUpdates
			await seat.update({
				seat_type: seatType,
			})

			const pattern = `screenSeats:${seat.screen_id}:*`
			const keys = await REDIS_KEYS(pattern)
			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const cacheKey = `screenSeat:${seat_id}`
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(seat))

			return seat
		} catch (error) {
			console.error('Error updating seat:', error)
			throw new Error('Could not update seat.')
		}
	}

	async deleteSeat({ seat_id }) {
		try {
			const seat = await ScreenSeat.findByPk(seat_id)
			if (!seat) {
				throw new Error(`Seat with ID ${seat_id} not found.`)
			}

			await seat.destroy()

			const pattern = `screenSeats:${seat.screen_id}:*`
			const keys = await REDIS_KEYS(pattern)
			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const cacheKey = `screenSeat:${seat_id}`
			await REDIS_DEL(cacheKey)

			return { success: true, message: 'Seat deleted successfully.' }
		} catch (error) {
			console.error('Error deleting seat:', error.message)
			throw new Error('Could not delete seat.')
		}
	}

	async getSeatsByScreen({ screenId: screen_id, search = '', sort = 'seat_row', order = 'ASC' }) {
		if (!screen_id) {
			throw new Error('Screen ID is required.')
		}

		const cacheKey = `screenSeats:${screen_id}:${search}:${sort}:${order}`
		try {
			const cachedSeats = JSON.parse(await REDIS_GET(cacheKey))
			if (cachedSeats) {
				console.log('Cache hit: Screen seats')
				return cachedSeats
			}

			console.log('Cache miss: Screen seats')

			let orderCondition = []

			if (sort === 'seat_row') {
				orderCondition.push(['seat_row', order.toUpperCase()])
				orderCondition.push(['seat_number', order.toUpperCase()])
			} else if (sort === 'seat_number') {
				orderCondition.push(['seat_number', order.toUpperCase()])
				orderCondition.push(['seat_row', order.toUpperCase()])
			} else {
				orderCondition.push([sort, order.toUpperCase()])
			}

			const seats = await ScreenSeat.findAndCountAll({
				where: {
					screen_id,
					[Op.or]: [
						{ seat_row: { [Op.like]: `%${search}%` } },
						{ seat_number: { [Op.like]: `%${search}%` } },
						{ seat_type: { [Op.like]: `${search}` } },
					],
				},
				order: orderCondition,
			})

			const response = {
				totalItems: seats.count,
				items: seats.rows,
			}

			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(response))

			return response
		} catch (error) {
			console.error('Error fetching seats by screen:', error.message)
			throw new Error('Failed to fetch seats.')
		}
	}

	async getSeatById({ seat_id }) {
		if (!seat_id) {
			throw new Error('Seat ID is required.')
		}

		const cacheKey = `screenSeat:${seat_id}`
		try {
			const cachedData = await REDIS_GET(cacheKey)
			if (cachedData) {
				console.log('Cache hit for seat ID:', seat_id)
				return JSON.parse(cachedData)
			}

			const seat = await ScreenSeat.findByPk(seat_id)
			if (!seat) {
				throw new Error(`Seat with ID ${seat_id} not found.`)
			}

			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(seat))
			return seat
		} catch (error) {
			console.error('Error fetching seat by ID:', error.message)
			throw new Error('Could not fetch seat by ID.')
		}
	}
}

module.exports = new seatService()
