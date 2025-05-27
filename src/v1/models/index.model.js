const User = require('./user.model')
const Role = require('./role.model')
const Address = require('./address.model')
const UserAddress = require('./userAddress.model')
const Movie = require('./movie.model')
const Genre = require('./genre.model')
const Actor = require('./actor.model')
const MovieGenre = require('./movie_genres.model')
const MovieActor = require('./movie_actors.model')
const Screen = require('./screen.model')
const ScreenSeat = require('./screenSeat.model')
const Theater = require('./theater.model')
const TheaterAddress = require('./theaterAddresses.model')
const ShowDate = require('./showdate.model')
const Showtime = require('./showtime.model')
const Booking = require('./booking.model')
const ScreenShowtime = require('./screenShowtime.model')
const Transaction = require('./transaction.model')
const UserWallet = require('./userWallet.model')
const Promotion = require('./promotion.model')
const Entertainment = require('./entertainment.model')

// User and Role - One-to-Many
Role.hasMany(User, { foreignKey: 'role_id' })
User.belongsTo(Role, { foreignKey: 'role_id' })

User.belongsToMany(Address, { through: UserAddress, foreignKey: 'user_id' })
Address.belongsToMany(User, { through: UserAddress, foreignKey: 'address_id' })

// Movie -> Genres (many-to-many)
Movie.belongsToMany(Genre, { through: MovieGenre, foreignKey: 'movie_id', onDelete: 'CASCADE' })
Genre.belongsToMany(Movie, { through: MovieGenre, foreignKey: 'genre_id' })

// Movie -> Actors (many-to-many)
Movie.belongsToMany(Actor, { through: MovieActor, foreignKey: 'movie_id', onDelete: 'CASCADE' })
Actor.belongsToMany(Movie, { through: MovieActor, foreignKey: 'actor_id' })

Theater.belongsToMany(Address, { through: TheaterAddress, foreignKey: 'theater_id' })
Address.belongsToMany(Theater, { through: TheaterAddress, foreignKey: 'address_id' })

Theater.hasMany(Screen, { foreignKey: 'theater_id', onDelete: 'CASCADE' })
Screen.belongsTo(Theater, { foreignKey: 'theater_id' })

Screen.hasMany(ScreenSeat, { foreignKey: 'screen_id', onDelete: 'CASCADE' })
ScreenSeat.belongsTo(Screen, { foreignKey: 'screen_id', onDelete: 'CASCADE' })

ShowDate.hasMany(Showtime, { foreignKey: 'show_date_id', onDelete: 'CASCADE' })

Showtime.belongsTo(ShowDate, { foreignKey: 'show_date_id', onDelete: 'CASCADE' })

Screen.belongsToMany(Showtime, {
	through: ScreenShowtime,
	foreignKey: 'screen_id',
	onDelete: 'CASCADE',
})
Showtime.belongsToMany(Screen, {
	through: ScreenShowtime,
	foreignKey: 'showtime_id',
	onDelete: 'CASCADE',
})
Showtime.hasMany(ScreenShowtime, {
	onDelete: 'CASCADE',
	foreignKey: 'showtime_id',
})
Screen.hasMany(ScreenShowtime, {
	onDelete: 'CASCADE',
	foreignKey: 'screen_id',
})

ScreenShowtime.belongsTo(Screen, {
	onDelete: 'CASCADE',
	foreignKey: 'screen_id',
})
ScreenShowtime.belongsTo(Showtime, {
	onDelete: 'CASCADE',
	foreignKey: 'showtime_id',
})

ShowDate.belongsTo(Movie, {
	foreignKey: 'movie_id',
	onDelete: 'CASCADE',
})
Movie.hasMany(ShowDate, {
	foreignKey: 'movie_id',
	onDelete: 'CASCADE',
})

User.hasMany(Booking, { foreignKey: 'user_id', onDelete: 'CASCADE' })
Booking.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' })

Showtime.hasMany(Booking, { foreignKey: 'showtime_id', onDelete: 'CASCADE' })
Booking.belongsTo(Showtime, { foreignKey: 'showtime_id', onDelete: 'CASCADE' })

Booking.hasMany(Transaction, { foreignKey: 'booking_id', onDelete: 'CASCADE' })
Transaction.belongsTo(Booking, { foreignKey: 'booking_id', onDelete: 'CASCADE' })

User.hasOne(UserWallet, {
	foreignKey: 'user_id',
	onDelete: 'CASCADE',
})
UserWallet.belongsTo(User, {
	foreignKey: 'user_id',
	onDelete: 'CASCADE',
})

module.exports = {
	User,
	Role,
	Address,
	UserAddress,
	Movie,
	Genre,
	Actor,
	MovieGenre,
	MovieActor,
	Screen,
	ScreenSeat,
	Theater,
	TheaterAddress,
	ShowDate,
	Showtime,
	Booking,
	Transaction,
	UserWallet,
	Promotion,
	Entertainment,
}
