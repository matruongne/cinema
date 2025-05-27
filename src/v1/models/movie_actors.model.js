const { DataTypes } = require('sequelize')
const { sequelize } = require('../configs/databases/init.mysql')
const Movie = require('./movie.model')
const Actor = require('./actor.model')

const MovieActor = sequelize.define(
	'MovieActor',
	{
		movie_id: {
			type: DataTypes.STRING(24),
			allowNull: false,
			references: {
				model: Movie,
				key: 'movie_id',
			},
			onDelete: 'CASCADE',
		},
		actor_id: {
			type: DataTypes.STRING(24),
			allowNull: false,
			references: {
				model: Actor,
				key: 'actor_id',
			},
			onDelete: 'CASCADE',
		},
		role: {
			type: DataTypes.STRING(255), // Role of the actor in the movie (e.g., "Lead", "Supporting")
			allowNull: true,
		},
	},
	{
		tableName: 'movie_actors',
		timestamps: false,
	}
)

module.exports = MovieActor
