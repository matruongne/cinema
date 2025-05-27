const express = require('express')
const router = express.Router()
const showdatesRouter = require('./showdate.router')
const showtimesRouter = require('./showtime.router')

router.get('/checkstatus', (req, res, next) => {
	res.status(200).json({
		status: 'success',
		message: 'api ok',
	})
})
router.use('/v1/showdates', showdatesRouter)
router.use('/v1/showtimes', showtimesRouter)

module.exports = router
