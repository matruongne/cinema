const express = require('express')
const actorsRouter = require('./actor.router')
const genresRouter = require('./genre.router')
const moviesRouter = require('./movie.router')
const router = express.Router()

router.get('/checkstatus', (req, res, next) => {
	res.status(200).json({
		status: 'success',
		message: 'api ok',
	})
})

router.use('/v1/actors', actorsRouter)
router.use('/v1/genres', genresRouter)
router.use('/v1/movies', moviesRouter)

module.exports = router
