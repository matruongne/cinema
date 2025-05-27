async function sendEmailToQueue(channel, message, bindingKey) {
	const EXCHANGE_NAME = 'emailExchange'
	channel.publish(EXCHANGE_NAME, bindingKey, Buffer.from(JSON.stringify(message)))
	console.log(`Message sent to ${bindingKey} queue:`, message)
}

module.exports = { sendEmailToQueue }
