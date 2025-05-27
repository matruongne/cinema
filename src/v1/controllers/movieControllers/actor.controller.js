const actorService = require('../../services/movieServices/actor.service')
const bindMethodsWithThisContext = require('../../utils/classes/bindMethodsWithThisContext')
const BasicController = require('../../utils/controllers/basicController')

class actorController extends BasicController {
	constructor() {
		super()
		bindMethodsWithThisContext(this)
	}
	async getAllActors(req, res) {
		try {
			const { sortBy = 'name', orderBy = 'ASC', ...filters } = req.query
			const actors = await actorService.getAllActors({ sortBy, orderBy, filters })
			res.json(actors)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async getActorById(req, res) {
		try {
			const { actorId } = req.params
			const actor = await actorService.getActorById({ actorId })
			if (!actor) {
				return res.status(404).json({ message: 'Actor not found.' })
			}
			res.json(actor)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async createActor(req, res) {
		try {
			const actorData = req.body
			const newActor = await actorService.createActor(actorData)
			res.status(201).json(newActor)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async updateActor(req, res) {
		try {
			const { actorId } = req.params
			const updateData = req.body
			const updatedActor = await actorService.updateActor({ actorId, updateData })
			res.json(updatedActor)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async deleteActor(req, res) {
		try {
			const { actorId } = req.params
			const result = await actorService.deleteActor({ actorId })
			res.json(result)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
}

module.exports = new actorController()
