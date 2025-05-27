const UserWallet = require('../../models/userWallet.model')
const User = require('../../models/user.model')

class WalletService {
	async getWalletByUserId(userId) {
		try {
			if (!userId) {
				return { success: false, message: 'Missing userId' }
			}

			let wallet = await UserWallet.findOne({
				where: { user_id: userId },
				include: [{ model: User }],
			})

			if (!wallet) {
				wallet = await UserWallet.create({ user_id: userId })
			}

			return { success: true, data: wallet }
		} catch (error) {
			console.error('getWalletByUserId error:', error.message)
			return { success: false, message: error.message }
		}
	}

	async updateWalletByUserId(userId, updateData) {
		try {
			if (!userId) {
				return { success: false, message: 'Missing userId' }
			}

			let wallet = await UserWallet.findOne({ where: { user_id: userId } })

			if (!wallet) {
				return { success: false, message: 'Wallet not found for this user' }
			}

			await wallet.update(updateData)

			return { success: true, data: wallet }
		} catch (error) {
			console.error('updateWalletByUserId error:', error.message)
			return { success: false, message: error.message }
		}
	}
}

module.exports = new WalletService()
