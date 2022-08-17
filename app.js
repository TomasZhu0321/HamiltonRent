if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const MongoStore = require('connect-mongo');

const userRoutes = require('./routes/users');
const housesRoutes = require('./routes/houses');
const reviewsRoutes = require('./routes/reviews');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/hamilton'; 

mongoose.connect(dbUrl);

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

const secret = process.env.SECRET ||'thisshouldbeabettersecret!'
const store = new MongoStore({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
}); 

store.on("error",function(e){
    console.log("SESSION STORE ERROR",e)
})
const sessionConfig = {
    store,
    name: 'session',
    secret,
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

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    if(!['/login','/'].includes(req.originalUrl)){
        req.session.returnTo = req.originalUrl;
    }
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
    
})
app.use('/', userRoutes);
app.use('/houses', housesRoutes)
app.use('/houses/:id/reviews', reviewsRoutes)

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

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log('Serving on port 4000')
})
