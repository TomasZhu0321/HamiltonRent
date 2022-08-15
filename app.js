const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const House = require('./models/house');
const ejsMate = require('ejs-mate');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const { houseSchemas,reviewSchema } = require('./schemas.js');
const Review = require('./models/review');

mongoose.connect('mongodb://localhost:27017/hamilton');
const db = mongoose.connection;


/*
    1.on: event will be called every time that is occurred
    2.console.error.bind: combine "error" with "connection" and console.log it
*/
db.on("error", console.error.bind(console, "connection error:"));
//once: only call once 
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

//every .ejs file will be rendered by ejsMate package
app.engine('ejs',ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const validateHouse = (req, res, next) => {
    const { error } = houseSchemas.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}
const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

app.get('/', (req, res) => {
    res.render('home')
});

//FIND:
//syn: Model.find()
app.get('/houses', catchAsync(async (req, res) => {
    const houses = await House.find({});
    res.render('houses/index', { houses })
}))

app.get('/houses/new', (req, res) => {
    res.render('houses/new');
})

//CREATE:
//According to Model to create instance
//using save() to mongoDB
app.post('/houses', validateHouse,catchAsync(async (req, res) => {
    const house = new House(req.body.house);
    await house.save();
    res.redirect(`/houses/${house._id}`)
}))

// req.params : url [compared to req.body: user submitted]
app.get('/houses/:id', catchAsync(async (req, res,) => {
    const house = await House.findById(req.params.id).populate('reviews');
    res.render('houses/show', { house });
}));

app.get('/houses/:id/edit', catchAsync(async (req, res) => {
    const house = await House.findById(req.params.id)
    res.render('houses/edit', { house });
}))

//...: 1. spread; 2. overwirte same key content
app.put('/houses/:id',validateHouse, catchAsync(async (req, res) => {
    const { id } = req.params;
    const house = await House.findByIdAndUpdate(id, { ...req.body.house });
    res.redirect(`/houses/${house._id}`)
}));

app.delete('/houses/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await House.findByIdAndDelete(id);
    res.redirect('/houses');
}))

app.post('/houses/:id/reviews', validateReview, catchAsync(async (req, res) => {
    const house = await House.findById(req.params.id);
    const review = new Review(req.body.review);
    house.reviews.push(review);
    await review.save();
    await house.save();
    res.redirect(`/houses/${house._id}`);
}))

app.delete('/houses/:id/reviews/:reviewId', catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await House.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/houses/${id}`);
}))

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})
//Express error handler function
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something Went Wrong...'
    res.status(statusCode).render('error', { err })
})

app.listen(4000, () => {
    console.log('Serving on port 4000')
})