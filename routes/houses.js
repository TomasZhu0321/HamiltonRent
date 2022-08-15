const express = require('express');
const router = express.Router();
const houses = require('../controllers/houses');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateHouse } = require('../middleware');


router.route('/')
    .get(catchAsync(houses.index))
    .post(isLoggedIn, validateHouse, catchAsync(houses.createHouse))

router.get('/new', isLoggedIn, houses.renderNewForm)

router.route('/:id')
    .get(catchAsync(houses.showHouse))
    .put(isLoggedIn, isAuthor, validateHouse, catchAsync(houses.updateHouse))
    .delete(isLoggedIn, isAuthor, catchAsync(houses.deleteHouse));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(houses.renderEditForm))

module.exports = router;