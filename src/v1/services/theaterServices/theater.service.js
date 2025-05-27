const { Op } = require('sequelize')
const Theater = require('../../models/theater.model')
const TheaterAddress = require('../../models/theaterAddresses.model')
const Address = require('../../models/address.model')
const { REDIS_DEL, REDIS_SETEX, REDIS_KEYS, REDIS_GET } = require('../redisServices/redis.service')
const Screen = require('../../models/screen.model')
const ScreenShowtime = require('../../models/screenShowtime.model')
const Showtime = require('../../models/showtime.model')
const ShowDate = require('../../models/showdate.model')

class theaterService {
	async createTheater({ name }) {
		if (!name || typeof name !== 'string') {
			throw new Error('Invalid theater name.')
		}

		try {
			const existingTheater = await Theater.findOne({ where: { name } })

			if (existingTheater) {
				throw new Error('Theater with this name already exists.')
			}

			const theater = await Theater.create({ name })

			const pattern = 'theaters:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const cacheKey = `theater:${theater.theater_id}`
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(theater))

			return theater
		} catch (error) {
			console.error('Error creating theater:', error.message)
			throw new Error(error.message || 'Could not create theater.')
		}
	}
	async updateTheater({ theaterId, theaterUpdates }) {
		console.log(theaterUpdates)
		try {
			const theater = await Theater.findByPk(theaterId)
			if (!theater) {
				throw new Error(`Theater with ID ${theaterId} not found.`)
			}

			await theater.update(theaterUpdates)

			const pattern = 'theaters:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const cacheKey = `theater:${theater.theater_id}`
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(theater))

			return theater
		} catch (error) {
			console.error('Error updating theater:', error.message)
			throw new Error('Could not update theater.')
		}
	}
	async updateTheaterAddress({ theaterId, addressData }) {
		try {
			const addressFields = {
				latitude: addressData.formatted.lat || addressData?.query?.lat,
				longitude: addressData.formatted.lon || addressData?.query?.lon,
				name: addressData.formatted.name || '',
				village: addressData.formatted.village || '',
				county: addressData.formatted.county || '',
				suburb: addressData.formatted.suburb || '',
				quarter: addressData.formatted.quarter || '',
				street: addressData.formatted.street || '',
				housenumber: addressData.formatted.housenumber || '',
				city: addressData.formatted.city || '',
				state: addressData.formatted.state || '',
				country: addressData.formatted.country || '',
				country_code: addressData.formatted.country_code || '',
				formatted: addressData.formatted.formatted || '',
				// plus_code: addressData?.query.plus_code,
				// plus_code_short: addressData?.features[0]?.properties?.plus_code_short || '',
			}
			let address = await Address.findOne({
				where: { latitude: addressFields.latitude, longitude: addressFields.longitude },
			})

			if (address) {
				await address.update(addressFields)

				const existingTheaterAddress = await TheaterAddress.findOne({
					where: { theater_id: theaterId, address_id: address.address_id },
				})
				if (!existingTheaterAddress) {
					await TheaterAddress.create({
						theater_id: theaterId,
						address_id: address.address_id,
						address_type: addressData.formatted.addressType,
					})
				} else
					await TheaterAddress.update(
						{
							address_type: addressData?.formatted.addressType,
						},
						{ where: { theater_id: theaterId, address_id: address.address_id } }
					)
			} else {
				address = await Address.create(addressFields)
				await TheaterAddress.create({
					theater_id: theaterId,
					address_id: address.address_id,
					address_type: addressData?.formatted.addressType,
				})
			}
			const pattern = 'theaters:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const cacheKey = `theater:${theaterId}`
			await REDIS_DEL(cacheKey)

			return await this.getTheaterById({ theaterId })
		} catch (error) {
			console.error('Error updating theater address:', error)
			throw new Error(error.message || 'Failed to update theater address')
		}
	}
	async deleteTheater({ theaterId }) {
		try {
			const theater = await Theater.findByPk(theaterId)
			if (!theater) {
				throw new Error(`Theater with ID ${theaterId} not found.`)
			}

			await theater.destroy()

			const pattern = 'theaters:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const cacheKey = `theater:${theaterId}`
			await REDIS_DEL(cacheKey)

			return { success: true, message: 'Theater deleted successfully.' }
		} catch (error) {
			console.error('Error deleting theater:', error.message)
			throw new Error('Could not delete theater.')
		}
	}
	async getTheaterById({ theaterId }) {
		if (!theaterId) {
			throw new Error('Theater ID is required.')
		}

		const cacheKey = `theater:${theaterId}`
		try {
			const cachedData = await REDIS_GET(cacheKey)

			if (cachedData) {
				console.log('Cache hit for theater ID:', theaterId)
				return JSON.parse(cachedData)
			}

			const theater = await Theater.findByPk(theaterId, {
				include: [
					{
						model: Screen,
						include: {
							model: ScreenShowtime,
							include: {
								model: Showtime,
								include: {
									model: ShowDate,
								},
							},
						},
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
			})
			if (!theater) {
				throw new Error(`Theater with ID ${theaterId} not found.`)
			}

			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(theater))
			console.log('Cache updated for theater ID:', theaterId)

			return theater
		} catch (error) {
			console.error('Error fetching theater by ID:', error.message)
			throw new Error(error.message || 'Could not fetch theater by ID.')
		}
	}

	async getTheaters({ search = '', sort = 'name', order = 'ASC', page = 1, limit = 10 }) {
		try {
			const offset = (page - 1) * limit
			const cacheKey = `theaters:${search}:${sort}:${order}:${page}:${limit}`
			const cachedTheaters = JSON.parse(await REDIS_GET(cacheKey))

			if (cachedTheaters) {
				console.log('Cache hit: Theaters')
				return cachedTheaters
			}

			console.log('Cache miss: Theaters')

			const theaters = await Theater.findAndCountAll({
				distinct: true,
				where: {
					[Op.or]: [{ name: { [Op.like]: `%${search}%` } }],
				},
				include: {
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
				order: [[sort, order.toUpperCase()]],
				limit,
				offset,
			})

			const response = {
				totalItems: theaters.count,
				totalPages: Math.ceil(theaters.count / limit),
				currentPage: page,
				items: theaters.rows,
			}

			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(response))

			return response
		} catch (error) {
			console.error('Error in fetch theaters:', error.message)
			throw new Error('Failed to fetch theaters.')
		}
	}

	async getTheatersByShowtimeIds({ showtimeIds }) {
		try {
			const theaters = await Theater.findAll({
				include: [
					{
						model: Screen,
						required: true,
						include: {
							model: ScreenShowtime,
							required: true,
							where: {
								showtime_id: {
									[Op.in]: showtimeIds,
								},
							},
						},
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
				distinct: true,
			})

			return theaters
		} catch (error) {
			console.error('Error in getTheatersByShowtimeIds:', error)
			throw new Error('Error in getTheatersByShowtimeIds.')
		}
	}
}

module.exports = new theaterService()
