const BasicController = require('../../utils/controllers/basicController')
const bindMethodsWithThisContext = require('../../utils/classes/bindMethodsWithThisContext')
const userService = require('../../services/userServices/user.service')
const { queueManager } = require('../../rabbitmq/queueManager')
const { sendEmailToQueue } = require('../../rabbitmq/publishs/emailPublisher')

class UserController extends BasicController {
	constructor() {
		super()
		bindMethodsWithThisContext(this)
	}
	async getUserById(req, res) {
		try {
			const user = await userService.getUserById({ id: req.body?.userId || req?.user.user_id })
			res.json(user)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async updateUser(req, res) {
		try {
			const user = await userService.updateUser({ id: req?.user.user_id, data: req.body })
			res.json(user)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async updateUserAddress(req, res) {
		try {
			const updateUser = await userService.updateUserAddress({
				id: req?.user.user_id,
				addressData: req.body,
			})
			res.json(updateUser)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async updatePassword(req, res) {
		try {
			const updateUser = await userService.updatePassword({
				id: req?.user.user_id,
				...req.body,
			})
			res.json(updateUser)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async deleteUser(req, res) {
		try {
			const updateUser = await userService.deleteUser({
				id: req?.user.user_id,
			})
			if (updateUser) {
				res.clearCookie('refreshToken')
				res.clearCookie('accessToken')
			}
			res.json(updateUser)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async requestPasswordReset(req, res) {
		try {
			const { email, user_id, resetCode } = await userService.requestPasswordReset(req.body)

			const channel = await queueManager()
			const dataSend = {
				email,
				resetCode: resetCode,
			}
			await sendEmailToQueue(channel, dataSend, 'password.reset')

			res.json({ email, user_id })
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async resetPassword(req, res) {
		try {
			const { processStatus } = await userService.resetPassword(req.body)

			if (!processStatus) {
				throw new Error('Checking reset password code failed')
			}
			return res.status(201).json({
				success: true,
				message: 'Checking reset password code for you account successfully',
			})
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async createNewPassword(req, res) {
		try {
			const { processStatus } = await userService.createNewPassword(req.body)

			if (!processStatus) {
				throw new Error('Creating new password failed')
			}
			return res.status(201).json({
				success: true,
				message: 'Creating new password for you account successfully',
			})
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
}

module.exports = new UserController()
