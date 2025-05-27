const theaterService = require('../../services/theaterServices/theater.service')
const bindMethodsWithThisContext = require('../../utils/classes/bindMethodsWithThisContext')
const BasicController = require('../../utils/controllers/basicController')

class theaterController extends BasicController {
	constructor() {
		super()
		bindMethodsWithThisContext(this)
	}

	async getTheaters(req, res) {
		try {
			const { search, sort, order, page, limit } = req.query
			const response = await theaterService.getTheaters({
				search,
				sort,
				order,
				page: Number(page),
				limit: Number(limit),
			})
			if (!response) {
				return res.status(404).json({ message: 'Theaters not found.' })
			}
			res.json(response)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async getTheaterById(req, res) {
		try {
			const { theaterId } = req.params
			const theater = await theaterService.getTheaterById({ theaterId })
			if (!theater) {
				return res.status(404).json({ message: 'Theater not found.' })
			}
			res.json(theater)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async getTheatersByShowtimeIds(req, res) {
		try {
			const idsParam = req.query.ids
			if (!idsParam) {
				return res.status(400).json({ message: 'Missing showtime ids.' })
			}

			const showtimeIds = idsParam.split(',').map(id => id.trim())
			const theaters = await theaterService.getTheatersByShowtimeIds({ showtimeIds })

			if (!theaters || theaters.length === 0) {
				return res.status(404).json({ message: 'No theaters found for the given showtime ids.' })
			}

			res.json(theaters)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async createTheater(req, res) {
		try {
			const theaterData = req.body
			const newTheater = await theaterService.createTheater(theaterData)
			res.status(201).json(newTheater)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async updateTheater(req, res) {
		try {
			const { theaterId } = req.params
			const theaterUpdates = req.body
			const updatedTheater = await theaterService.updateTheater({ theaterId, theaterUpdates })
			res.json(updatedTheater)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async updateTheaterAddress(req, res) {
		try {
			const { theaterId } = req.params

			const updateTheater = await theaterService.updateTheaterAddress({
				theaterId,
				addressData: req.body,
			})
			res.json(updateTheater)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async deleteTheater(req, res) {
		try {
			const { theaterId } = req.params
			const result = await theaterService.deleteTheater({ theaterId })
			res.json(result)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
}

module.exports = new theaterController()
