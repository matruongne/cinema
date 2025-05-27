const { DataTypes } = require('sequelize')
const { sequelize } = require('../configs/databases/init.mysql')
const { v4: uuidv4 } = require('uuid')

const Movie = sequelize.define(
	'Movie',
	{
		movie_id: {
			type: DataTypes.STRING(24),
			defaultValue: () => uuidv4().replace(/-/g, '').slice(0, 24),
			primaryKey: true,
		},
		title: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		description: {
			type: DataTypes.TEXT,
		},
		release_date: {
			type: DataTypes.DATE,
		},
		duration: {
			type: DataTypes.INTEGER,
		},
		director: {
			type: DataTypes.STRING(255),
		},
		language: {
			type: DataTypes.STRING(50),
		},
		poster_url: {
			type: DataTypes.STRING(255),
		},
		trailer_url: {
			type: DataTypes.STRING(255),
		},
		rating: {
			type: DataTypes.DECIMAL(5, 1),
		},
		age_rating: {
			type: DataTypes.STRING(10),
		},
		production_company: {
			type: DataTypes.STRING(255),
		},
		cast_json: {
			type: DataTypes.JSON,
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
		tableName: 'movies',

		timestamps: true,
		updatedAt: 'updated_at',
		createdAt: 'created_at',
	}
)

module.exports = Movie
