const PromotionService = require('../../services/promotionServices/promotion.service')
const bindMethodsWithThisContext = require('../../utils/classes/bindMethodsWithThisContext')
const BasicController = require('../../utils/controllers/basicController')

class PromotionController extends BasicController {
	constructor() {
		super()
		bindMethodsWithThisContext(this)
	}
	async create(req, res) {
		try {
			const newPromotion = await PromotionService.createPromotion(req.body)
			res.status(201).json(newPromotion)
		} catch (err) {
			console.error(err)
			res.status(500).json({ message: 'Failed to create promotion' })
		}
	}

	async getAll(req, res) {
		try {
			const { page, limit, search } = req.query
			const result = await PromotionService.getAllPromotions({
				page: parseInt(page) || 1,
				limit: parseInt(limit) || 10,
				search: search || '',
			})
			res.json(result)
		} catch (err) {
			console.error(err)
			res.status(500).json({ message: 'Failed to fetch promotions' })
		}
	}

	async getById(req, res) {
		try {
			const promotion = await PromotionService.getPromotionById(req.params.id)
			if (!promotion) return res.status(404).json({ message: 'Promotion not found' })
			res.json(promotion)
		} catch (err) {
			console.error(err)
			res.status(500).json({ message: 'Failed to fetch promotion' })
		}
	}

	async update(req, res) {
		try {
			const updated = await PromotionService.updatePromotion(req.params.id, req.body)
			if (!updated) return res.status(404).json({ message: 'Promotion not found' })
			res.json(updated)
		} catch (err) {
			console.error(err)
			res.status(500).json({ message: 'Failed to update promotion' })
		}
	}

	async delete(req, res) {
		try {
			const deleted = await PromotionService.deletePromotion(req.params.id)
			if (!deleted) return res.status(404).json({ message: 'Promotion not found' })
			res.json({ message: 'Promotion deleted successfully' })
		} catch (err) {
			console.error(err)
			res.status(500).json({ message: 'Failed to delete promotion' })
		}
	}
}

module.exports = new PromotionController()
