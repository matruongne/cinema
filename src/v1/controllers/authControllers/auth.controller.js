const BasicController = require('../../utils/controllers/basicController')
const bindMethodsWithThisContext = require('../../utils/classes/bindMethodsWithThisContext')
const authService = require('../../services/authServices/auth.service')
const { sendEmailToQueue } = require('../../rabbitmq/publishs/emailPublisher')
const { queueManager } = require('../../rabbitmq/queueManager')

class AuthController extends BasicController {
	constructor() {
		super()
		bindMethodsWithThisContext(this)
	}

	async register(req, res) {
		try {
			const { email, verifyCode } = await authService.register(req.body)

			const channel = await queueManager()
			const dataSend = {
				email: email,
				verifyCode: verifyCode,
			}
			await sendEmailToQueue(channel, dataSend, 'register.success')

			return res.status(201).json({
				success: true,
				message: 'User registered successfully!',
			})
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async verifyAccount(req, res) {
		try {
			const { accountStatus, accessToken, refreshToken } = await authService.verifyAccount(req.body)

			if (!accountStatus) {
				throw new Error('Verification account failed')
			}
			res.cookie('refreshToken', refreshToken, {
				httpOnly: true,
				sameSite: 'Lax',
				maxAge: process.env.REFRESH_TOKEN_MAX_AGE_MILLISECONDS,
			})

			res.cookie('accessToken', accessToken, {
				httpOnly: true,
				sameSite: 'Lax',
				maxAge: process.env.ACCESS_TOKEN_MAX_AGE_MILLISECONDS,
			})

			return res.status(201).json({
				success: true,
				message: 'User verified account successfully',
			})
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async resendVerificationCode(req, res) {
		try {
			const { email, newCode } = await authService.resendVerificationCode(req.body)

			const channel = await queueManager()
			const dataSend = {
				email,
				verifyCode: newCode,
			}

			await sendEmailToQueue(channel, dataSend, 'register.success')

			return res.status(201).json({
				success: true,
				message: 'resend verification code successfully',
			})
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async login(req, res) {
		try {
			const { accessToken, refreshToken } = await authService.login(req.body)
			res.cookie('refreshToken', refreshToken, {
				httpOnly: true,
				sameSite: 'Lax',
				maxAge: process.env.REFRESH_TOKEN_MAX_AGE_MILLISECONDS,
			})

			res.cookie('accessToken', accessToken, {
				httpOnly: true,
				sameSite: 'Lax',
				maxAge: process.env.ACCESS_TOKEN_MAX_AGE_MILLISECONDS,
			})

			return res.json({ token: accessToken })
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async checkAuth(req, res) {
		try {
			// Lấy thông tin xác thực từ cookie của request
			const userData = await authService.checkAuth(req.cookies)
			return res.status(200).json({
				success: true,
				data: userData,
				message: 'User is authenticated',
			})
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async refreshToken(req, res) {
		try {
			const token = await authService.refreshToken(req.cookies)
			res.cookie('accessToken', token, {
				httpOnly: true,
				sameSite: 'Lax',
				maxAge: process.env.ACCESS_TOKEN_MAX_AGE_MILLISECONDS,
			})
			return res.status(200).json({ token })
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async logout(req, res) {
		try {
			await authService.clearToken({ currentUser: req.user })
			res.clearCookie('refreshToken', {
				httpOnly: true,
				sameSite: 'Lax',
			})
			res.clearCookie('accessToken', {
				httpOnly: true,
				sameSite: 'Lax',
			})
			return res.json({
				success: true,
				message: `User ${req.user.user_id} has been logged out success`,
			})
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
}

module.exports = new AuthController()
