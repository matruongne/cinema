const showtimeService = require('../../services/showtimeServices/showtime.service')
const bindMethodsWithThisContext = require('../../utils/classes/bindMethodsWithThisContext')
const BasicController = require('../../utils/controllers/basicController')

class showtimeController extends BasicController {
	constructor() {
		super()
		bindMethodsWithThisContext(this)
	}

	async addShowtime(req, res) {
		try {
			const showtimeData = req.body
			const newshowTime = await showtimeService.addShowtime({ ...showtimeData })
			res.status(201).json(newshowTime)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async updateShowtime(req, res) {
		try {
			const { showtimeId } = req.params
			const showTimeUpdate = req.body
			const showTimeUpdated = await showtimeService.updateShowtime({ showtimeId, showTimeUpdate })

			if (showTimeUpdated[0]) res.status(200).json({ message: 'Show time updated successfully.' })
			else res.status(404).json({ message: 'Update show time failed' })
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async deleteShowtime(req, res) {
		try {
			const { showtimeId } = req.params
			const showTimeDeleted = await showtimeService.deleteShowtime({ showtimeId })
			res.status(200).json(showTimeDeleted)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
}

module.exports = new showtimeController()
