const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const House = require('../models/house');

mongoose.connect('mongodb://localhost:27017/hamilton');

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];


const seedDB = async () => {
    await House.deleteMany({});
    for (let i = 0; i < 3; i++) {
        const random3 = Math.floor(Math.random() * 3);
        const price = Math.floor(Math.random() * 20) + 10;
        const house = new House({
            author: '62fa9de680a7fc1f8c8fbcb9',
            location: `${cities[random3].city}, ${cities[random3].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            price,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam dolores vero perferendis laudantium, consequuntur voluptatibus nulla architecto, sit soluta esse iure sed labore ipsam a cum nihil atque molestiae deserunt!',
            images: [
                {
                    url: 'https://res.cloudinary.com/douqbebwk/image/upload/v1600060601/YelpCamp/ahfnenvca4tha00h2ubt.png',
                    filename: 'YelpCamp/ahfnenvca4tha00h2ubt'
                },
                {
                    url: 'https://res.cloudinary.com/douqbebwk/image/upload/v1600060601/YelpCamp/ruyoaxgf72nzpi4y6cdi.png',
                    filename: 'YelpCamp/ruyoaxgf72nzpi4y6cdi'
                }
            ],
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random3].longitude,
                    cities[random3].latitude,
                ]
            },
        })
        await house.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})