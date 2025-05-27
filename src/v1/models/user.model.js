const { DataTypes } = require('sequelize')
const { sequelize } = require('../configs/databases/init.mysql')
const { v4: uuidv4 } = require('uuid')
const Role = require('./role.model')

const User = sequelize.define(
	'User',
	{
		user_id: {
			type: DataTypes.STRING(24),
			defaultValue: () => uuidv4().replace(/-/g, '').slice(0, 24),
			primaryKey: true,
		},
		username: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
		},
		password_hash: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
		},
		phone: {
			type: DataTypes.STRING,
		},
		salt: {
			type: DataTypes.BLOB,
		},
		avatarUrl: {
			type: DataTypes.TEXT,
		},
		refreshToken: {
			type: DataTypes.STRING,
		},
		resetPasswordToken: {
			type: DataTypes.STRING,
		},
		is_verified: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		role_id: {
			type: DataTypes.STRING(24),
			references: {
				model: Role,
				key: 'role_id',
			},
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		updated_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		timestamps: true,
		updatedAt: 'updated_at',
		createdAt: 'created_at',
	}
)

module.exports = User
