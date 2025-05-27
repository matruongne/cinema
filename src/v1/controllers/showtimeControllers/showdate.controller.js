const showdateService = require('../../services/showtimeServices/showdate.service')
const bindMethodsWithThisContext = require('../../utils/classes/bindMethodsWithThisContext')
const BasicController = require('../../utils/controllers/basicController')

class showdateController extends BasicController {
	constructor() {
		super()
		bindMethodsWithThisContext(this)
	}

	async addShowDate(req, res) {
		try {
			const showdateData = req.body
			const newshowDate = await showdateService.addShowDate({ ...showdateData })
			res.status(201).json(newshowDate)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async getShowDate(req, res) {
		try {
			const { showDateId } = req.params
			const showDate = await showdateService.getShowDate({ showDateId })
			res.status(200).json(showDate)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async getAllShowDatesByMovie(req, res) {
		try {
			const { movieId } = req.query
			const showDates = await showdateService.getAllShowDatesByMovie({ movieId })
			res.status(200).json(showDates)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async updateShowDate(req, res) {
		try {
			const { showDateId } = req.params
			const ShowDateUpdate = req.body
			const showDateUpdated = await showdateService.updateShowDate({ showDateId, ShowDateUpdate })

			if (showDateUpdated[0]) res.status(200).json({ message: 'Show date updated successfully.' })
			else res.status(404).json({ message: 'Update show date failed' })
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async deleteShowDate(req, res) {
		try {
			const { showDateId } = req.params
			const showDateDeleted = await showdateService.deleteShowDate({ showDateId })
			res.status(200).json(showDateDeleted)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
}

module.exports = new showdateController()
