const EntertainmentService = require('../../services/entertainmentServices/entertainment.service')
const bindMethodsWithThisContext = require('../../utils/classes/bindMethodsWithThisContext')
const BasicController = require('../../utils/controllers/basicController')

class EntertainmentController extends BasicController {
	constructor() {
		super()
		bindMethodsWithThisContext(this)
	}
	async create(req, res) {
		try {
			const newEntertainment = await EntertainmentService.createEntertainment(req.body)
			res.status(201).json(newEntertainment)
		} catch (err) {
			console.error(err)
			res.status(500).json({ message: 'Failed to create entertainment' })
		}
	}

	async getAll(req, res) {
		try {
			const { page, limit, search } = req.query
			const result = await EntertainmentService.getAllEntertainments({
				page: parseInt(page) || 1,
				limit: parseInt(limit) || 10,
				search: search || '',
			})
			res.json(result)
		} catch (err) {
			console.error(err)
			res.status(500).json({ message: 'Failed to fetch entertainments' })
		}
	}

	async getById(req, res) {
		try {
			const entertainment = await EntertainmentService.getEntertainmentById(req.params.id)
			if (!entertainment) return res.status(404).json({ message: 'Entertainment not found' })
			res.json(entertainment)
		} catch (err) {
			console.error(err)
			res.status(500).json({ message: 'Failed to fetch entertainment' })
		}
	}

	async update(req, res) {
		try {
			const updated = await EntertainmentService.updateEntertainment(req.params.id, req.body)
			if (!updated) return res.status(404).json({ message: 'Entertainment not found' })
			res.json(updated)
		} catch (err) {
			console.error(err)
			res.status(500).json({ message: 'Failed to update entertainment' })
		}
	}

	async delete(req, res) {
		try {
			const deleted = await EntertainmentService.deleteEntertainment(req.params.id)
			if (!deleted) return res.status(404).json({ message: 'Entertainment not found' })
			res.json({ message: 'Entertainment deleted successfully' })
		} catch (err) {
			console.error(err)
			res.status(500).json({ message: 'Failed to delete entertainment' })
		}
	}
}

module.exports = new EntertainmentController()
