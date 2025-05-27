const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const logger = require('./v1/utils/logs/logger')
const cors = require('cors')
const cronsJob = require('./v1/crons/index.crons')
const paypal = require('paypal-rest-sdk')

const app = express()

//init dbs
require('./v1/configs/databases/init.redis')
require('./v1/configs/databases/init.mysql')

//user middleware
app.use(helmet())

const allowedOrigins = process.env.FESITE?.split(',') || []

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				return callback(null, true)
			}
			return callback(new Error('Not allowed by CORS'))
		},
		credentials: true,
	})
)
app.use(cookieParser()) // Sử dụng cookie-parser middleware

app.use(
	morgan('combined', {
		stream: {
			write: message => logger.info(message.trim()), // Direct Morgan's logs to Winston's info level
		},
	})
)

// compress responses
app.use(compression())

// add body-parser
app.use(express.json())
app.use(
	express.urlencoded({
		extended: true,
	})
)
//model
require('./v1/models/index.model')

//crons
cronsJob()

//rabbitmq
// require('./v1/rabbitmq/queueManager')

//router
app.use(require('./v1/routes/authRoutes/index.router'))
app.use(require('./v1/routes/bookingRoutes/index.router'))
app.use(require('./v1/routes/movieRoutes/index.router'))
app.use(require('./v1/routes/showtimeRoutes/index.router'))
app.use(require('./v1/routes/theaterRoutes/index.router'))
app.use(require('./v1/routes/userRoutes/index.router'))
app.use(require('./v1/routes/transactionRoutes/index.router'))
app.use(require('./v1/routes/promotionRoutes/index.router'))
app.use(require('./v1/routes/entertainmentRoutes/index.router'))

//paypal
paypal.configure({
	mode: 'sandbox',
	client_id: 'ASV2U3QvRTRWDiZ_ph94UZ347Ih6QVx74CGb4NR0xv8rowOgNd-sekIV6oYTsOufDa02lY8J7OZBX1Gs',
	client_secret: 'EPEhYOsWN7dQUgetoL6-acTE8oM9wO1AXCeBCDIcZ7m7KElF3cjfzPNICFd1dTyC19A6ZfnsachyY0BJ',
})

// Error Handling Middleware called

app.use((req, res, next) => {
	const error = new Error('Not found')
	error.status = 404
	next(error)
})

// error handler middleware
app.use((error, req, res, next) => {
	res.status(error.status || 500).send({
		error: {
			status: error.status || 500,
			message: error.message || 'Internal Server Error',
		},
	})
})

module.exports = app
