const express = require('express')
const actorController = require('../../controllers/movieControllers/actor.controller')
const actorsRouter = express.Router()
const isAdmin = require('../../middlewares/isAdmin')
const isAuth = require('../../middlewares/isAuth')

actorsRouter.get('/', actorController.getAllActors)
actorsRouter.get('/:actorId', actorController.getActorById)

actorsRouter.use(isAuth)
actorsRouter.use(isAdmin)
actorsRouter.post('/new', actorController.createActor)
actorsRouter.patch('/:actorId', actorController.updateActor)
actorsRouter.delete('/:actorId', actorController.deleteActor)

module.exports = actorsRouter
