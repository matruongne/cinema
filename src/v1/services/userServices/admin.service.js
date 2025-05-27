const { Op } = require('sequelize')
const Address = require('../../models/address.model')
const Role = require('../../models/role.model')
const User = require('../../models/user.model')
const { REDIS_GET, REDIS_SETEX, REDIS_DEL } = require('../redisServices/redis.service')

class adminService {
	async createRole({ role }) {
		if (!role || typeof role !== 'string' || role.trim() === '') {
			throw new Error('A valid role name is required')
		}

		const existingRole = await Role.findOne({ where: { role_name: role.toLowerCase() } })
		if (existingRole) {
			throw new Error('Role already exists')
		}

		const newRole = await Role.create({ role_name: role.toLowerCase() })

		await REDIS_DEL('all-roles:')

		return newRole
	}

	async updateRole({ role_id, newRoleName }) {
		if (!role_id || !newRoleName || typeof newRoleName !== 'string' || newRoleName.trim() === '') {
			throw new Error('Valid role ID and new role name are required')
		}

		const role = await Role.findOne({ where: { role_id: role_id } })
		if (!role) {
			throw new Error('Role not found')
		}

		const duplicateRole = await Role.findOne({
			where: { role_name: newRoleName.toLowerCase(), role_id: { [Op.ne]: role_id } },
		})
		if (duplicateRole) {
			throw new Error('Another role with the same name already exists')
		}

		role.role_name = newRoleName.toLowerCase()
		await role.save()

		await REDIS_DEL('all-roles:')

		return role
	}
	async getAllRole({ sortBy = 'role_name', sortOrder = 'ASC' }) {
		const cacheKey = `all-roles:${sortBy}:${sortOrder}`
		const cachedRoles = await REDIS_GET(cacheKey)

		if (cachedRoles) {
			return JSON.parse(cachedRoles)
		}

		const validSortFields = ['role_name', 'created_at', 'updated_at']
		const validSortOrders = ['ASC', 'DESC']

		const sortField = validSortFields.includes(sortBy) ? sortBy : 'role_name'
		const sortDirection = validSortOrders.includes(sortOrder.toUpperCase())
			? sortOrder.toUpperCase()
			: 'ASC'

		const roles = await Role.findAll({ order: [[sortField, sortDirection]] })
		await REDIS_SETEX(cacheKey, 600, JSON.stringify(roles))

		return roles
	}

	async deleteRole({ role_id }) {
		if (!role_id) {
			throw new Error('Role ID is required')
		}

		const role = await Role.findOne({ where: { role_id: role_id } })
		if (!role) {
			throw new Error('Role not found')
		}

		const userCount = await User.count({ where: { role_id: role_id } })
		if (userCount > 0) {
			throw new Error('Role is assigned to users and cannot be deleted')
		}

		await Role.destroy({ where: { role_id: role_id } })

		// Clear roles cache to reflect deleted role
		await REDIS_DEL('all-roles:')

		return { message: 'Role deleted successfully' }
	}

	async updateUserRole({ adminUser, targetUserId, role_id }) {
		if (!adminUser) {
			throw new Error('Admin user not found')
		}
		if (adminUser.role !== 'admin') {
			throw new Error('Permission denied: Only admins can assign roles')
		}

		const targetUser = await User.findOne({ where: { user_id: targetUserId } })
		if (!targetUser) {
			throw new Error('Target user not found')
		}

		if (targetUser.role_id === role_id) {
			throw new Error('Target user already has the specified role')
		}

		const role = await Role.findOne({ where: { role_id: role_id } })
		if (!role) {
			throw new Error('Role not found')
		}

		const [updateCount] = await User.update(
			{ role_id: role_id },
			{ where: { user_id: targetUserId } }
		)

		if (updateCount === 1) {
			return { userId: targetUserId, ...role.dataValues }
		} else {
			throw new Error('Failed to update user role')
		}
	}

	async getlistUsers({
		page = 1,
		limit = 10,
		role_id,
		isVerified,
		sort = 'created_at',
		order = 'DESC',
	}) {
		const where = {}
		if (role_id) where.role_id = role_id
		if (isVerified !== undefined) where.is_verified = isVerified

		const offset = (page - 1) * limit

		const validSortFields = ['created_at', 'updated_at', 'username', 'email']
		const validOrders = ['ASC', 'DESC']

		const sortField = validSortFields.includes(sort) ? sort : 'created_at'
		const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC'

		const { rows, count } = await User.findAndCountAll({
			where,
			attributes: [
				'user_id',
				'username',
				'email',
				'phone',
				'avatarUrl',
				'created_at',
				'updated_at',
			],
			include: [
				{
					model: Role,
					attributes: ['role_id', 'role_name'],
				},
				{
					model: Address,
					through: {
						attributes: ['address_type'],
					},
					attributes: [
						'address_id',
						'latitude',
						'longitude',
						'street',
						'city',
						'state',
						'country',
						'formatted',
					],
				},
			],
			limit,
			offset,
			order: [[sortField, sortOrder]],
		})

		const result = {
			users: rows,
			total: count,
			pages: Math.ceil(count / limit),
			currentPage: page,
			perPage: limit,
		}

		return result
	}
}

module.exports = new adminService()
