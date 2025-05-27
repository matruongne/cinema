const WalletService = require('../../services/userServices/wallet.service')
const BasicController = require('../../utils/controllers/basicController')

class WalletController extends BasicController {
	async getWalletByUserId(req, res) {
		try {
			const { userId } = req.params

			const result = await WalletService.getWalletByUserId(userId)

			if (!result.success) {
				return res.status(404).json({ success: false, message: result.message })
			}

			return res.status(200).json({ success: true, data: result.data })
		} catch (error) {
			console.error('[WalletController] error:', error.message)
			return res.status(500).json({ success: false, message: 'Internal server error.' })
		}
	}

	async updateWalletByUserId(req, res) {
		try {
			const { userId } = req.params
			const updateData = req.body

			const result = await WalletService.updateWalletByUserId(userId, updateData)

			if (!result.success) {
				return res.status(404).json({ success: false, message: result.message })
			}

			return res.status(200).json({ success: true, data: result.data })
		} catch (error) {
			console.error('[WalletController] error:', error.message)
			return res.status(500).json({ success: false, message: 'Internal server error.' })
		}
	}
}

module.exports = new WalletController()
