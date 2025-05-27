const express = require('express')
const router = express.Router()
const userRouter = require('./user.router')
const adminRouter = require('./admin.router')
const walletRouter = require('./wallet.routes')

router.get('/checkstatus', (req, res, next) => {
	res.status(200).json({
		status: 'success',
		message: 'api ok',
	})
})

router.use('/v1/user', userRouter)

router.use('/v1/admin', adminRouter)

router.use('/v1/wallet', walletRouter)

module.exports = router
