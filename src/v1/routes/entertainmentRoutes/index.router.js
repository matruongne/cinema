const express = require('express')
const router = express.Router()
const entertainmentRouter = require('./entertainment.router')

router.get('/checkstatus', (req, res, next) => {
	res.status(200).json({
		status: 'success',
		message: 'api ok',
	})
})
router.use('/v1/entertainments', entertainmentRouter)

module.exports = router
