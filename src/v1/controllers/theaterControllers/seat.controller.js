const seatService = require('../../services/theaterServices/seat.service')
const bindMethodsWithThisContext = require('../../utils/classes/bindMethodsWithThisContext')
const BasicController = require('../../utils/controllers/basicController')

class seatController extends BasicController {
	constructor() {
		super()
		bindMethodsWithThisContext(this)
	}

	async getSeatsByScreen(req, res) {
		try {
			const { screenId, search, sort, order } = req.query
			const response = await seatService.getSeatsByScreen({
				screenId,
				search,
				sort,
				order,
			})
			if (!response) {
				return res.status(404).json({ message: 'Seats not found.' })
			}
			res.json(response)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async getSeatById(req, res) {
		try {
			const { seatId } = req.params
			const seat = await seatService.getSeatById({ seat_id: seatId })
			if (!seat) {
				return res.status(404).json({ message: 'Seat not found.' })
			}
			res.json(seat)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async createSeatsBatch(req, res) {
		try {
			const seatsData = req.body
			const newSeats = await seatService.createSeatsBatch(seatsData)
			res.status(201).json(newSeats)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async updateSeat(req, res) {
		try {
			const { seatId } = req.params
			const seatUpdates = req.body
			const updatedSeat = await seatService.updateSeat({ seat_id: seatId, seatUpdates })
			res.json(updatedSeat)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async deleteSeat(req, res) {
		try {
			const { seatId } = req.params
			const result = await seatService.deleteSeat({ seat_id: seatId })
			res.json(result)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
}

module.exports = new seatController()
