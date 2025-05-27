const bookingService = require('../../services/bookingServices/booking.service')
const bindMethodsWithThisContext = require('../../utils/classes/bindMethodsWithThisContext')
const BasicController = require('../../utils/controllers/basicController')

class bookingController extends BasicController {
	constructor() {
		super()
		bindMethodsWithThisContext(this)
	}

	async holdSeats(req, res) {
		try {
			const { showtimeId } = req.params
			const { requestedSeats, selectedSeats } = req.body
			const userId = req.user.user_id

			const result = await bookingService.holdSeats({
				showtimeId,
				requestedSeats,
				selectedSeats,
				userId,
			})

			if (!result.success) {
				res.status(400).json(result.message)
			}

			res.status(201).json(result.seats)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async removeHoldSeat(req, res) {
		try {
			const { showtimeId } = req.params
			const { seatId } = req.body
			const userId = req.user.user_id

			const result = await bookingService.removeHoldSeat({
				showtimeId,
				seatId,
				userId,
			})

			if (!result.success) {
				return res.status(400).json({ message: result.message })
			}

			return res.status(200).json({ message: 'Seat hold removed successfully', seatId })
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async createBooking(req, res) {
		try {
			const userId = req.user.user_id
			const { showtimeId } = req.params
			const { seatIds, totalPrice } = req.body
			const booking = await bookingService.createBooking({
				showtimeId,
				userId,
				seatIds,
				totalPrice,
			})
			res.status(201).json(booking)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async confirmBooking(req, res) {
		try {
			const { bookingId } = req.params
			const result = await bookingService.confirmBooking({ bookingId })

			if (!result.success) {
				res.status(400).json(result.message)
			}

			res.status(201).json(result.message)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async cancelBooking(req, res) {
		try {
			const userId = req.user.user_id
			const { bookingId } = req.params
			const cancelBooking = await bookingService.cancelBooking({
				userId,
				bookingId,
			})
			if (!cancelBooking.success) {
				res.status(400).json(cancelBooking.message)
			}

			res.status(201).json({ message: cancelBooking.message, refund: cancelBooking.refund })
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async getBookings(req, res) {
		try {
			const { search, sort, order, page, limit, theaterId, status } = req.query

			const bookings = await bookingService.getBookings({
				search,
				sort,
				order,
				page: Number(page),
				limit: Number(limit),
				theaterId,
				status,
			})

			if (!bookings) {
				return res.status(404).json({ message: 'Bookings not found.' })
			}

			res.status(200).json(bookings)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async getBookingsByShowtime(req, res) {
		try {
			const { showtimeId } = req.params
			const bookings = await bookingService.getBookingsByShowtime({
				showtimeId,
			})
			res.status(200).json(bookings)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async getBookingHistory(req, res) {
		try {
			const userId = req.user.user_id
			const data = await bookingService.getBookingHistory({ userId })
			res.status(200).json(data)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
}

module.exports = new bookingController()
