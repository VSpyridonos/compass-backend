const User = require('../models/user');
const Input = require('../models/input');
const Tour = require('../models/tour');
const Point = require('../models/point');
const Measurement = require('../models/measurement');

const mongoose = require('mongoose');

require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/dockerApp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
})

const seedDB = async () => {
    await User.deleteMany({});
    await Measurement.deleteMany({});

    // User seeds
    const user1 = new User({ username: 'giannakis5', name: 'giannis', email: 'giannis@gmail.com' });
    const user2 = new User({ username: 'takis13', name: 'takis', email: 'takis@gmail.com' });
    const user3 = new User({ username: 'patatakis28', name: 'patatakis', email: 'patatakis@gmail.com' });
    const user4 = new User({ username: 'aris123', name: 'aris', email: 'arispap@gmail.com' });
    const user5 = new User({ username: 'georgia22', name: 'georgia', email: 'georgia2@gmail.com' });
    const user6 = new User({ username: 'vasilis124', name: 'vasilis', email: 'vasilis21@gmail.com' });
    const user7 = new User({ username: 'vanessarocks', name: 'vanessa', email: 'vanessarocks@gmail.com' });

    await user1.save();
    await user2.save();
    await user3.save();
    await user4.save();
    await user5.save();
    await user6.save();
    await user7.save();


    // Measurement seeds
    let measurementCounter = 0;

    while (measurementCounter < 10) {
        let measurement = new Measurement({ user: user1.id, x: 39.67326618500352 + measurementCounter, y: 20.85536924387071 + measurementCounter, speed: 2.5 });
        measurement.xHatOriginal = [[measurement.x], [measurement.y], [measurement.speed]];
        measurement.xHat = [[measurement.x], [measurement.y], [measurement.speed]];
        measurement.xHatNew = [[measurement.x + 0.25], [measurement.y + 0.25], [measurement.speed]];
        await measurement.save();
        await user1.measurements.push(measurement);
        measurementCounter++;
    }
    await user1.save();

}

seedDB();
console.log("Seeding done!");