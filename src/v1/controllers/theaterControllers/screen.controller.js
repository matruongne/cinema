const screenService = require('../../services/theaterServices/screen.service')
const bindMethodsWithThisContext = require('../../utils/classes/bindMethodsWithThisContext')
const BasicController = require('../../utils/controllers/basicController')

class screenController extends BasicController {
	constructor() {
		super()
		bindMethodsWithThisContext(this)
	}

	async getScreens(req, res) {
		try {
			const { theaterId, search, sort, order, page, limit } = req.query

			const response = await screenService.getScreens({
				theaterId,
				search,
				sort,
				order,
				page: Number(page),
				limit: Number(limit),
			})
			if (!response) {
				return res.status(404).json({ message: 'Screens not found.' })
			}
			res.json(response)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async createScreen(req, res) {
		try {
			const screenData = req.body
			const newScreen = await screenService.createScreen({ ...screenData })
			res.status(201).json(newScreen)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async updateScreen(req, res) {
		try {
			const { screenId } = req.params
			const screenUpdates = req.body
			const updatedScreen = await screenService.updateScreen({ screenId, screenUpdates })
			res.json(updatedScreen)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async deleteScreen(req, res) {
		try {
			const { screenId } = req.params
			const result = await screenService.deleteScreen({ screenId })
			res.json(result)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async getShowtimesByScreen(req, res) {
		try {
			const { screenId } = req.params

			const result = await screenService.getShowtimesByScreen({ screenId })

			return res.json(result)
		} catch (err) {
			return this.handleResponseError(res, err)
		}
	}
}

module.exports = new screenController()
