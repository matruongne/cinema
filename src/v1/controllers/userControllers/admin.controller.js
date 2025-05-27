const BasicController = require('../../utils/controllers/basicController')
const bindMethodsWithThisContext = require('../../utils/classes/bindMethodsWithThisContext')
const adminService = require('../../services/userServices/admin.service')

class AdminController extends BasicController {
	constructor() {
		super()
		bindMethodsWithThisContext(this)
	}
	async getlistUsers(req, res) {
		try {
			const users = await adminService.getlistUsers({ ...req.query })
			res.json(users)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async createRole(req, res) {
		try {
			const newRole = await adminService.createRole({ role: req.body.role })
			res.json(newRole)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async updateRole(req, res) {
		try {
			const updateRole = await adminService.updateRole({
				role_id: req.params.id,
				newRoleName: req.body.newRoleName,
			})
			res.json(updateRole)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async deleteRole(req, res) {
		try {
			const deletedRole = await adminService.deleteRole({
				role_id: req.params.id,
			})
			res.json(deletedRole)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async getAllRole(req, res) {
		try {
			const roles = await adminService.getAllRole({
				...req.query,
			})
			res.json(roles)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
	async updateUserRole(req, res) {
		try {
			const roles = await adminService.updateUserRole({
				adminUser: req.user,
				targetUserId: req.params.targetUserId,
				role_id: req.body.role_id,
			})
			res.json(roles)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
}

module.exports = new AdminController()
