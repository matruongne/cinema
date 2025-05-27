const express = require('express')
const WalletController = require('../../controllers/userControllers/wallet.controller')

const router = express.Router()

router.get('/:userId', WalletController.getWalletByUserId)

router.patch('/:userId', WalletController.updateWalletByUserId)

module.exports = router
