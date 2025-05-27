const express = require('express')
const router = express.Router()
const promotionRouter = require('./promotion.router')

router.get('/checkstatus', (req, res, next) => {
	res.status(200).json({
		status: 'success',
		message: 'api ok',
	})
})
router.use('/v1/promotions', promotionRouter)

module.exports = router
