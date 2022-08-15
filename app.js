const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const House = require('./models/house');
const ejsMate = require('ejs-mate');

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


app.get('/', (req, res) => {
    res.render('home')
});

//FIND:
//syn: Model.find()
app.get('/houses', async (req, res) => {
    const houses = await House.find({});
    res.render('houses/index', { houses })
});
app.get('/houses/new', (req, res) => {
    res.render('houses/new');
})

//CREATE:
//According to Model to create instance
//using save() to mongoDB
app.post('/houses', async (req, res) => {
    const house = new House(req.body.house);
    await house.save();
    res.redirect(`/houses/${house._id}`)
})

// req.params : url [compared to req.body: user submitted]
app.get('/houses/:id', async (req, res,) => {
    const house = await House.findById(req.params.id)
    res.render('houses/show', { house });
});

app.get('/houses/:id/edit', async (req, res) => {
    const house = await House.findById(req.params.id)
    res.render('houses/edit', { house });
})

//...: 1. spread; 2. overwirte same key content
app.put('/houses/:id', async (req, res) => {
    const { id } = req.params;
    const house = await House.findByIdAndUpdate(id, { ...req.body.house });
    res.redirect(`/houses/${house._id}`)
});

app.delete('/houses/:id', async (req, res) => {
    const { id } = req.params;
    await House.findByIdAndDelete(id);
    res.redirect('/houses');
})



app.listen(4000, () => {
    console.log('Serving on port 4000')
})