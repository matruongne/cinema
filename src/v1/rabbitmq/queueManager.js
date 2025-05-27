const { connectRabbitMQ } = require('../configs/rabbitmq/configs.rabbitmq')
const { rabbitmqConnection } = require('../configs/rabbitmq/init.rabbitmq')

const EXCHANGE_NAME = 'emailExchange'
const EXCHANGE_TYPE = 'direct'
const EXCHANGE_OPTIONS = { durable: true }

const queues = [{ QUEUE_NAME: 'registerQueue', QUEUE_BINDING_KEY: 'register.success' }]

const queueManager = async () => {
	const channel = await rabbitmqConnection(process.env.RABBITMQ_URL)
	await connectRabbitMQ({
		channel,
		EXCHANGE_NAME,
		EXCHANGE_TYPE,
		EXCHANGE_OPTIONS,
		queues,
	})
	return channel
}
module.exports = { queueManager }
