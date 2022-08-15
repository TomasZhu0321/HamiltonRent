const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');


const houses = require('./routes/houses');
const reviews = require('./routes/reviews');

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
//Does not execute any req, just a setup function telling experss that it needs to serve static files
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/houses', houses)
app.use('/houses/:id/reviews', reviews)

app.get('/', (req, res) => {
    res.render('home')
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

app.listen(4000, () => {
    console.log('Serving on port 4000')
})