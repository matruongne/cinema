const moment = require('moment')
const {
	ScreenSeat,
	Booking,
	Screen,
	User,
	Movie,
	Theater,
	UserWallet,
} = require('../../models/index.model')
const { REDIS_GET, REDIS_SETEX, REDIS_DEL, REDIS_KEYS } = require('../redisServices/redis.service')
const allocateSeatsWithNoLonelySeats = require('../../utils/seatAllocation/allocateSeatsWithNoLonelySeats')
const { sequelize } = require('../../configs/databases/init.mysql')
const { Op } = require('sequelize')
const Showtime = require('../../models/showtime.model')
const ShowDate = require('../../models/showdate.model')
const ScreenShowtime = require('../../models/screenShowtime.model')

class BookingService {
	async holdSeats({ showtimeId, requestedSeats, selectedSeats, userId }) {
		const transaction = await sequelize.transaction()
		try {
			const availableSeats = await ScreenSeat.findAll({
				include: [
					{
						model: Screen,
						required: true,
						include: [
							{
								model: ScreenShowtime,
								required: true,
								where: { showtime_id: showtimeId },
								attributes: [],
							},
						],
						attributes: [],
					},
				],
				where: {
					status: 'available',
				},
				attributes: ['seat_id', 'seat_row', 'seat_number'],
				raw: true,
				transaction,
			})

			const seatList = availableSeats.map(seat => ({
				seat_code: `${seat.seat_row}${seat.seat_number}`,
				seat_id: seat.seat_id,
			}))

			const result = allocateSeatsWithNoLonelySeats(seatList, requestedSeats, selectedSeats)

			if (!result.success) {
				await transaction.rollback()
				return { success: false, message: result.message }
			}

			const holdSeats = result.seats

			const holdKey = `hold:showtime:${showtimeId}:seats`
			await Promise.all(
				holdSeats.map(seat =>
					REDIS_SETEX(
						`${holdKey}:${seat.seat_id}`,
						400,
						JSON.stringify({
							time: moment().add(5, 'minutes').toISOString(),
							seatId: seat.seat_id,
							showtimeId,
							userId,
						})
					)
				)
			)

			await ScreenSeat.update(
				{ status: 'held' },
				{ where: { seat_id: holdSeats.map(seat => seat.seat_id) }, transaction }
			)

			await transaction.commit()

			const pattern = 'screenSeats:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}
			return { success: true, seats: holdSeats, message: 'Seats held successfully.' }
		} catch (error) {
			await transaction.rollback()
			console.error(`[Hold Seats] Error: ${error.message}`)
			throw new Error(error.message || 'Failed to hold seats.')
		}
	}

	async removeHoldSeat({ showtimeId, seatId, userId }) {
		const holdKey = `hold:showtime:${showtimeId}:seats:${seatId}`

		const heldDataRaw = await REDIS_GET(holdKey)
		if (!heldDataRaw) {
			return { success: false, message: 'Seat is not currently held' }
		}

		const heldData = JSON.parse(heldDataRaw)

		if (heldData.userId !== userId) {
			return { success: false, message: 'You are not holding this seat' }
		}
		await ScreenSeat.update({ status: 'available' }, { where: { seat_id: seatId } })

		await REDIS_DEL(holdKey)

		const pattern = 'screenSeats:*'
		const keys = await REDIS_KEYS(pattern)

		for (const key of keys) {
			await REDIS_DEL(key)
		}
		return { success: true }
	}

	async releaseSeats({ showtimeId, seatId }) {
		const transaction = await sequelize.transaction()
		try {
			const releaseKey = `hold:showtime:${showtimeId}:seats:${seatId}`
			await REDIS_DEL(releaseKey)

			await ScreenSeat.update({ status: 'available' }, { where: { seat_id: seatId }, transaction })

			await transaction.commit()
			return { success: true, message: 'Seats released successfully.' }
		} catch (error) {
			await transaction.rollback()
			console.error(`[Release Seats] Error: ${error.message}`)
			throw new Error(error.message || 'Failed to release seats.')
		}
	}

	async createBooking({ showtimeId, userId, seatIds, totalPrice }) {
		const transaction = await sequelize.transaction()
		try {
			const seats = await ScreenSeat.findAll({
				where: { seat_id: seatIds },
				attributes: ['seat_id', 'seat_row', 'seat_number', 'status'],
				transaction,
			})

			if (seats.length !== seatIds.length) {
				throw new Error('Some seats are invalid.')
			}

			const unavailableSeats = seats.filter(seat => ['reserved', 'occupied'].includes(seat.status))

			if (unavailableSeats.length > 0) {
				throw new Error(
					`Seats not available: ${unavailableSeats
						.map(s => `${s.seat_row}${s.seat_number}`)
						.join(', ')}`
				)
			}

			const seatCodes = seats.map(seat => {
				return { seat_id: seat.seat_id, seat_code: `${seat.seat_row}${seat.seat_number}` }
			})

			const newBooking = await Booking.create(
				{
					showtime_id: showtimeId,
					user_id: userId,
					seats: seatCodes,
					total_price: parseFloat(totalPrice),
					payment_status: 'PENDING',
				},
				{ transaction }
			)

			await ScreenSeat.update(
				{ status: 'reserved', booking_id: newBooking.booking_id },
				{ where: { seat_id: seatIds }, transaction }
			)
			const expirationTime = moment().add(30, 'minutes').toISOString()

			const cacheKey = `bookings:showtime:${showtimeId}:${newBooking.booking_id}`
			await REDIS_SETEX(cacheKey, 3000, JSON.stringify({ expirationTime, newBooking }))

			for (const seat of seatIds) {
				const cacheKey2 = `hold:showtime:${newBooking.showtime_id}:seats:${seat}`
				await REDIS_DEL(cacheKey2)
			}

			await transaction.commit()
			return newBooking
		} catch (error) {
			await transaction.rollback()
			console.error(`[Create Booking] Error: ${error.message}`)
			throw new Error(error.message || 'Failed to create booking.')
		}
	}

	async cancelPendingBooking(bookingId) {
		const transaction = await sequelize.transaction()
		try {
			const booking = await Booking.findOne({
				where: { booking_id: bookingId, payment_status: 'PENDING' },
				attributes: ['booking_id', 'seats'],
			})

			if (!booking) {
				return { success: false, message: 'Booking not found or not eligible for cancellation.' }
			}

			const seatIds = JSON.parse(booking.seats).map(seat => seat.seat_id)

			await ScreenSeat.update(
				{ status: 'available', booking_id: null },
				{ where: { seat_id: seatIds }, transaction }
			)

			await Booking.update(
				{ payment_status: 'CANCELED' },
				{ where: { booking_id: bookingId }, transaction }
			)

			await transaction.commit()
			return { success: true, message: 'Booking canceled successfully.' }
		} catch (error) {
			await transaction.rollback()
			console.error(`[Cancel Pending Booking] Error: ${error.message}`)
			throw new Error('Failed to cancel pending booking.')
		}
	}

	async confirmBooking({ bookingId }) {
		const transaction = await sequelize.transaction()
		try {
			const booking = await Booking.findByPk(bookingId, { transaction })
			if (!booking) {
				throw new Error('Booking not found.')
			}

			if (booking.payment_status !== 'PENDING') {
				throw new Error('Booking is not in a valid state for confirmation.')
			}

			await booking.update({ payment_status: 'COMPLETED' }, { transaction })

			await ScreenSeat.update(
				{ status: 'occupied' },
				{ where: { booking_id: bookingId }, transaction }
			)

			const pattern = 'bookings:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			await transaction.commit()
			return { success: true, message: 'Booking COMPLETED successfully.' }
		} catch (error) {
			await transaction.rollback()
			console.error(`[Confirm Booking] Error: ${error.message}`)
			throw new Error(error.message || 'Failed to confirm booking.')
		}
	}

	async cancelBooking({ userId, bookingId }) {
		const transaction = await sequelize.transaction()
		try {
			const booking = await Booking.findOne({
				where: { booking_id: bookingId, user_id: userId },
				include: {
					model: Showtime,
					attributes: ['show_time', 'show_date_id'],
					include: {
						model: ShowDate,
						attributes: ['show_date'],
					},
				},
			})

			if (!booking) {
				throw new Error('Booking not found.')
			}

			if (booking.payment_status === 'CANCELED') {
				throw new Error('Booking is already CANCELED.')
			}

			const showtime = booking.Showtime
			const showDate = new Date(showtime.ShowDate.show_date)
			const showTime = new Date(`${showDate.toDateString()} ${showtime.show_time}`)
			const currentTime = new Date()
			const hoursUntilShowtime = (showTime - currentTime) / (1000 * 60 * 60)

			if (hoursUntilShowtime < 0) {
				throw new Error('Cannot cancel after showtime.')
			}

			// Tính toán hoàn tiền theo khoảng cách giờ
			let refundAmount = 0
			if (hoursUntilShowtime >= 6) {
				refundAmount = Number(booking.total_price)
			} else if (hoursUntilShowtime >= 3) {
				refundAmount = Number(booking.total_price) * 0.5
			} else if (hoursUntilShowtime >= 1) {
				refundAmount = Number(booking.total_price) * 0.3
			} else {
				refundAmount = 0
			}

			await booking.update({ payment_status: 'CANCELED' }, { transaction })

			const seatIds = JSON.parse(booking.seats).map(seat => seat.seat_id)
			console.log(seatIds)
			await ScreenSeat.update(
				{ status: 'available', booking_id: null },
				{ where: { seat_id: seatIds }, transaction }
			)

			if (refundAmount > 0) {
				const [wallet, created] = await UserWallet.findOrCreate({
					where: { user_id: booking.user_id },
					defaults: { balance: 0 },
					transaction,
				})

				await wallet.update({ balance: Number(wallet.balance) + refundAmount }, { transaction })
			}

			const cacheKey = `bookings:showtime:${booking.showtime_id}:${booking.booking_id}`
			await REDIS_DEL(cacheKey)

			const pattern = 'bookings:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const pattern2 = 'screenSeats:*'
			const key2 = await REDIS_KEYS(pattern2)

			for (const key of key2) {
				await REDIS_DEL(key)
			}

			await transaction.commit()

			return {
				success: true,
				message: `Booking canceled. Refund amount: ${refundAmount}.`,
				refund: refundAmount,
			}
		} catch (error) {
			if (transaction) await transaction.rollback()
			console.error(`[Cancel Booking] Error: ${error.message}`)
			throw new Error(error.message || 'Failed to cancel booking.')
		}
	}

	async getBookings({
		search = '',
		sort = 'updated_at',
		order = 'ASC',
		page = 1,
		limit = 10,
		theaterId = '',
		status = '',
	}) {
		console.log(theaterId)
		const cacheKey = `bookings:${search}:${sort}:${order}:${page}:${limit}:${theaterId}:${status}`
		const offset = (page - 1) * limit

		try {
			const cachedBookings = await REDIS_GET(cacheKey)
			if (cachedBookings) {
				return JSON.parse(cachedBookings)
			}

			const where = {
				[Op.and]: [
					{
						[Op.or]: [
							{ payment_status: { [Op.like]: `%${search}%` } },
							{ total_price: { [Op.like]: `%${search}%` } },
							{ '$User.username$': { [Op.like]: `%${search}%` } },
							{ '$User.email$': { [Op.like]: `%${search}%` } },
							{ '$Showtime.ScreenShowtimes.Screen.Theater.name$': { [Op.like]: `%${search}%` } },
						],
					},
				],
			}

			// Nếu có filter thêm
			if (theaterId) {
				where[Op.and].push({
					'$Showtime.ScreenShowtimes.Screen.Theater.theater_id$': theaterId,
				})
			}
			if (status) {
				where[Op.and].push({
					payment_status: status,
				})
			}

			const bookings = await Booking.findAndCountAll({
				include: [
					{
						model: Showtime,
						required: false,
						attributes: ['showtime_id', 'show_time'],
						include: [
							{
								model: ShowDate,
								include: [
									{
										model: Movie,
										attributes: ['movie_id', 'title'],
									},
								],
							},
							{
								model: ScreenShowtime,
								include: [
									{
										model: Screen,
										attributes: ['screen_id', 'screen_name'],
										include: [
											{
												model: Theater,
												attributes: ['theater_id', 'name'],
											},
										],
									},
								],
							},
						],
					},
					{
						model: User,
						required: false,
						attributes: ['user_id', 'username', 'email'],
					},
				],
				where,
				order: [[sort, order.toUpperCase()]],
				offset,
				limit,
				subQuery: false,
			})

			const response = {
				totalItems: bookings.count,
				totalPages: Math.ceil(bookings.count / limit),
				currentPage: page,
				items: bookings.rows,
			}

			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(response))

			return response
		} catch (error) {
			console.error('[Get Bookings] Error:', error.message)
			throw new Error('Failed to fetch bookings.')
		}
	}

	async getBookingsByShowtime({ showtimeId }) {
		const cacheKey = `bookings:showtime:${showtimeId}`
		try {
			const cachedBookings = await REDIS_GET(cacheKey)
			if (cachedBookings) {
				return JSON.parse(cachedBookings)
			}

			const bookings = await Booking.findAll({ where: { showtime_id: showtimeId } })

			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(bookings))

			return bookings
		} catch (error) {
			console.error('[Get Bookings] Error:', error.message)
			throw new Error('Failed to fetch bookings.')
		}
	}
	async getBookingHistory({ userId }) {
		try {
			const bookings = await Booking.findAll({
				where: { user_id: userId },
				attributes: ['booking_id', 'seats', 'total_price', 'payment_status', 'created_at'],
				include: [
					{
						model: Showtime,
						attributes: ['showtime_id', 'show_time'],
						include: [
							{
								model: ShowDate,
								attributes: ['show_date_id', 'show_date'],
								include: [
									{
										model: Movie,
										attributes: ['movie_id', 'title'],
									},
								],
							},
							{
								model: ScreenShowtime,
								include: [
									{
										model: Screen,
										attributes: ['screen_id', 'screen_name'],
										include: [
											{
												model: Theater,
												attributes: ['theater_id', 'name'],
											},
										],
									},
								],
							},
						],
					},
				],
				order: [['created_at', 'DESC']],
			})

			if (!bookings.length) {
				return { success: true, data: [], message: 'No bookings found.' }
			}

			const history = {
				completed: [],
				canceled: [],
				pending: [],
			}

			bookings.forEach(booking => {
				history[booking.payment_status.toLowerCase()].push(booking)
			})

			return history
		} catch (error) {
			console.error(`[Get Booking History] Error: ${error.message}`)
			throw new Error('Failed to fetch booking history.')
		}
	}
}

module.exports = new BookingService()
