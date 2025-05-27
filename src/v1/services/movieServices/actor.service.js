const { Op } = require('sequelize')
const Actor = require('../../models/actor.model')
const MovieActor = require('../../models/movie_actors.model')
const { REDIS_GET, REDIS_SETEX, REDIS_DEL, REDIS_KEYS } = require('../redisServices/redis.service')

class actorService {
	async getAllActors({ sortBy = 'name', orderBy = 'ASC', filters = {} }) {
		try {
			const cacheKey = `actors:all:${sortBy}:${orderBy}:${JSON.stringify(filters)}`
			const cachedActors = await REDIS_GET(cacheKey)

			if (cachedActors) {
				console.log('Cache hit: Actors')
				return JSON.parse(cachedActors)
			}

			console.log('Cache miss: Actors')

			const queryOptions = {
				where: filters,
				order: [[sortBy, orderBy.toUpperCase()]],
			}

			const actors = await Actor.findAll(queryOptions)

			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(actors))
			return actors
		} catch (error) {
			throw new Error(error.message || 'Failed to fetch actors.')
		}
	}

	async getActorById({ actorId }) {
		try {
			const cacheKey = `actor:${actorId}`
			let actor = await REDIS_GET(cacheKey)

			if (actor) {
				console.log('Cache hit:', cacheKey)
				return JSON.parse(actor)
			}

			console.log('Cache miss:', cacheKey)

			actor = await Actor.findByPk(actorId)

			if (!actor) {
				throw new Error('Actor not found.')
			}

			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(actor))

			return actor
		} catch (error) {
			throw new Error(error.message || `Failed to get actor ${actorId}.`)
		}
	}

	async createActor(actorData) {
		try {
			if (!actorData.name) {
				throw new Error('Actor name is required.')
			}

			const existingActor = await Actor.findOne({ where: { name: actorData.name } })
			if (existingActor) {
				throw new Error('An actor with this name already exists.')
			}

			const newActor = await Actor.create(actorData)

			const cacheKey = `actor:${newActor.actor_id}`
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(newActor))

			const pattern = 'actors:all:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			return newActor
		} catch (error) {
			throw new Error(error.message || 'Failed to create actor.')
		}
	}

	async updateActor({ actorId, updateData }) {
		try {
			const actor = await Actor.findByPk(actorId)
			if (!actor) {
				throw new Error('Actor not found.')
			}

			if (updateData.name) {
				const existingActor = await Actor.findOne({
					where: { name: updateData.name, actor_id: { [Op.ne]: actorId } },
				})
				if (existingActor) {
					throw new Error('An actor with this name already exists.')
				}
			}

			const updatedActor = await actor.update(updateData)

			const cacheKey = `actor:${actorId}`
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(updatedActor))

			const pattern = 'actors:all:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			return updatedActor
		} catch (error) {
			throw new Error(error.message || 'Failed to update actor.')
		}
	}

	async deleteActor({ actorId }) {
		try {
			const actor = await Actor.findByPk(actorId)
			if (!actor) {
				throw new Error('Actor not found.')
			}

			const isReferenced = await MovieActor.findOne({ where: { actor_id: actorId } })

			if (isReferenced) {
				throw new Error('Actor cannot be deleted as they are referenced in movies.')
			}

			await actor.destroy()

			const cacheKey = `actor:${actorId}`
			await REDIS_DEL(cacheKey)

			const pattern = 'actors:all:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			return { message: 'Actor deleted successfully.' }
		} catch (error) {
			throw new Error(error.message || 'Failed to delete actor.')
		}
	}
}

module.exports = new actorService()
