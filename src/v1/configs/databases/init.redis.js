const { createClient } = require('redis')
const redisClient = createClient({
	url:
		'redis://default:wWfyguHIlndgQ68somHkRVBVjNwsH4bR@redis-12831.c278.us-east-1-4.ec2.redns.redis-cloud.com:12831' ||
		process.env.REDIS_URL ||
		process.env.REDIS_CLOUD_URL,
	legacyMode: true,
})
;(async () => {
	try {
		await redisClient.connect()
		console.log('Redis client connected')
	} catch (error) {
		console.error('Redis connection error:', error)
	}
})()

redisClient.ping(function (err, result) {
	console.log(result)
})

redisClient.on('error', error => {
	console.error(error)
})

module.exports = redisClient
