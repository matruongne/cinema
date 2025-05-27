const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const {
	generateAuthToken,
	generateRefreshTokenAndSaveIfNeeded,
} = require('../../utils/JWT/handlingJWT')
const { User, Role } = require('../../models/index.model')
const {
	TargetAlreadyExistException,
	BadRequestException,
	TargetNotExistException,
} = require('../../utils/exceptions/commonException')
const { REDIS_SETEX, REDIS_DEL, REDIS_GET } = require('../redisServices/redis.service')
const {
	generateVerificationCode,
	getFromRedis,
	saveToRedis,
	deleteFromRedis,
} = require('../../utils/verifies/verifiesHandling')

class authService {
	async register({ username, password, email }) {
		try {
			const existingUser = await User.findOne({ where: { username } })

			if (existingUser) {
				throw new TargetAlreadyExistException()
			}

			const userRole = await Role.findOne({ where: { role_name: 'user' } })
			if (!userRole) {
				throw new Error('Default role "user" not found')
			}

			const salt = await bcrypt.genSalt(10)
			const passwordHash = await bcrypt.hash(password, salt)

			await User.create({
				username,
				password_hash: passwordHash,
				email,
				salt,
				role_id: userRole.role_id,
			})

			const redisKey = `verify:${email}`

			const verifyCode = generateVerificationCode()

			await saveToRedis(redisKey, verifyCode, 300)

			return {
				email,
				verifyCode,
			}
		} catch (error) {
			console.error(`Register Account for ${email}:`, error.message)
			throw new Error(error.message || 'Register Account failed.')
		}
	}

	async verifyAccount({ email, verifyCode }) {
		try {
			const userWithRole = await User.findOne({
				where: { email },
				include: [{ model: Role, attributes: ['role_id', 'role_name'] }],
			})
			if (userWithRole.is_verified) {
				throw new Error('User already have been verified')
			}

			const redisKey = `verify:${email}`
			const attemptsKey = `verify-attempts:${email}`
			const maxAttempts = 5

			let attempts = await getFromRedis(attemptsKey)
			attempts = attempts ? parseInt(attempts) : 0

			if (attempts >= maxAttempts) {
				throw new Error('Maximum verification attempts reached. Please request a new code.')
			}

			const code = await getFromRedis(redisKey)

			if (!code) {
				throw new Error('Verification code not found or expired.')
			}

			if (code !== verifyCode.toString()) {
				await saveToRedis(attemptsKey, attempts + 1, 600)
				throw new Error('Invalid verification code.')
			}

			await deleteFromRedis(redisKey)
			await deleteFromRedis(attemptsKey)

			const updatedRows = await User.update({ is_verified: true }, { where: { email } })

			if (updatedRows === 0) {
				throw new Error('User not found or already verified.')
			}

			const accessToken = await generateAuthToken(userWithRole)
			const refreshToken = await generateRefreshTokenAndSaveIfNeeded(userWithRole)

			return {
				accountStatus: true,
				accessToken,
				refreshToken,
				message: 'Verification successful. User logged in.',
			}
		} catch (error) {
			console.error(`Verification failed for ${email}:`, error.message)
			throw new Error(error.message || 'Verification failed.')
		}
	}

	async resendVerificationCode({ email }) {
		try {
			const user = await User.findOne({
				where: { email },
			})
			if (user.is_verified) {
				throw new Error('User already have been verified')
			}

			const redisKey = `verify:${email}`
			const existingCode = await getFromRedis(redisKey)

			if (existingCode) {
				throw new Error('A verification code is already active. Please wait until it expires.')
			}

			const newCode = generateVerificationCode()
			await saveToRedis(redisKey, newCode, 600)

			return { email, newCode }
		} catch (error) {
			console.error(`Failed to resend verification code for ${email}:`, error.message)
			throw new Error(error.message || 'Failed to resend verification code.')
		}
	}

	async login({ username, password }) {
		const existingUser = await User.findOne({
			where: { username },
			include: [
				{
					model: Role,
					attributes: ['role_id', 'role_name'],
				},
			],
		})

		if (!existingUser) {
			throw new TargetNotExistException()
		}
		const isValid = await bcrypt.compare(password, existingUser.password_hash)

		if (!isValid) {
			throw new BadRequestException('Password incorrect')
		}

		const isVerified = existingUser.is_verified

		if (!isVerified) {
			throw new BadRequestException("Account doesn't verified")
		}

		const accessToken = await generateAuthToken(existingUser)
		const refreshToken = await generateRefreshTokenAndSaveIfNeeded(existingUser)

		return {
			accessToken,
			refreshToken,
		}
	}

	async checkAuth(cookies) {
		const accessToken = cookies.accessToken
		if (!accessToken) {
			throw new Error('Access token not found')
		}
		try {
			// Giải mã accessToken với JWT_SECRET
			const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET)
			return decoded // decoded chứa thông tin user được mã hóa trong token
		} catch (err) {
			throw new Error('Invalid or expired access token')
		}
	}

	async refreshToken({ refreshToken }) {
		let user_id
		try {
			const data = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET)
			user_id = data.user_id
		} catch (err) {
			throw new BadRequestException('Invalid token or token expired')
		}

		const user = await User.findOne({ where: { user_id: user_id, refreshToken: refreshToken } })

		if (!user) {
			throw new BadRequestException('Invalid token')
		}

		return await generateAuthToken(user)
	}

	async clearToken({ currentUser }) {
		const user = await User.findOne({ where: { user_id: currentUser.user_id } })
		user.refreshToken = null
		await user.save()
		await REDIS_DEL('user_token:' + currentUser.user_id)
	}
}

module.exports = new authService()
