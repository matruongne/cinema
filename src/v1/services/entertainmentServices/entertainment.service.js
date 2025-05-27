const Entertainment = require('../../models/entertainment.model')
const { Op } = require('sequelize')

class EntertainmentService {
	async createEntertainment(data) {
		return await Entertainment.create(data)
	}

	async getAllEntertainments({ page = 1, limit = 10, search = '' }) {
		const offset = (page - 1) * limit
		const where = search
			? {
					title: {
						[Op.like]: `%${search}%`,
					},
			  }
			: {}

		const { count, rows } = await Entertainment.findAndCountAll({
			where,
			limit,
			offset,
			order: [['created_at', 'DESC']],
		})

		return {
			totalItems: count,
			totalPages: Math.ceil(count / limit),
			currentPage: parseInt(page),
			entertainments: rows,
		}
	}

	async getEntertainmentById(entertainment_id) {
		return await Entertainment.findByPk(entertainment_id)
	}

	async updateEntertainment(entertainment_id, data) {
		const entertainment = await Entertainment.findByPk(entertainment_id)
		if (!entertainment) return null
		await entertainment.update(data)
		return entertainment
	}

	async deleteEntertainment(entertainment_id) {
		const entertainment = await Entertainment.findByPk(entertainment_id)
		if (!entertainment) return null
		await entertainment.destroy()
		return true
	}
}

module.exports = new EntertainmentService()
