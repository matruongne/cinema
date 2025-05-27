const { REDIS_GET, REDIS_SETEX, REDIS_DEL } = require('../../services/redisServices/redis.service')
const crypto = require('crypto')

function generateVerificationCode() {
	return crypto.randomInt(100000, 999999).toString()
}

async function saveToRedis(key, data, ttl = 300) {
	try {
		await REDIS_SETEX(key, ttl, data)
	} catch (error) {
		console.error(`Error saving to Redis (key: ${key}):`, error.message)
		throw new Error('Failed to save data to Redis.')
	}
}

async function getFromRedis(key) {
	try {
		const result = await REDIS_GET(key)
		return result
	} catch (error) {
		console.error(`Error retrieving from Redis (key: ${key}):`, error.message)
		throw new Error('Failed to retrieve data from Redis.')
	}
}

async function deleteFromRedis(key) {
	try {
		await REDIS_DEL(key)
	} catch (error) {
		console.error(`Error deleting from Redis (key: ${key}):`, error.message)
		throw new Error('Failed to delete data from Redis.')
	}
}

module.exports = {
	generateVerificationCode,
	saveToRedis,
	getFromRedis,
	deleteFromRedis,
}
