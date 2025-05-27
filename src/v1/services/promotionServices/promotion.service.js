const Promotion = require('../../models/promotion.model')
const { Op } = require('sequelize')

class PromotionService {
	async createPromotion(data) {
		return await Promotion.create(data)
	}

	async getAllPromotions({ page = 1, limit = 10, search = '' }) {
		const offset = (page - 1) * limit
		const where = search
			? {
					title: {
						[Op.like]: `%${search}%`,
					},
			  }
			: {}

		const { count, rows } = await Promotion.findAndCountAll({
			where,
			limit,
			offset,
			order: [['created_at', 'DESC']],
		})

		return {
			totalItems: count,
			totalPages: Math.ceil(count / limit),
			currentPage: parseInt(page),
			promotions: rows,
		}
	}

	async getPromotionById(promotion_id) {
		return await Promotion.findByPk(promotion_id)
	}

	async updatePromotion(promotion_id, data) {
		const promotion = await Promotion.findByPk(promotion_id)
		if (!promotion) return null
		await promotion.update(data)
		return promotion
	}

	async deletePromotion(promotion_id) {
		const promotion = await Promotion.findByPk(promotion_id)
		if (!promotion) return null
		await promotion.destroy()
		return true
	}
}

module.exports = new PromotionService()
