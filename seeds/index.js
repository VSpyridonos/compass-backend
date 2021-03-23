const User = require('../models/user');
const Input = require('../models/input');
const Tour = require('../models/tour');
const Point = require('../models/point');
const Measurement = require('../models/measurement');

const mongoose = require('mongoose');
const measurement = require('../models/measurement');

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
        let measurement = new Measurement({ user: user1.id, x: 39.67326618500352 + measurementCounter * 0.0001, y: 20.85536924387071 + measurementCounter * 0.0001, speed: 2.5 });
        measurement.xHatOriginal = [[measurement.x], [measurement.y], [measurement.speed]];
        measurement.xHat = [[measurement.x], [measurement.y], [measurement.speed]];
        measurement.xHatNew = [[measurement.x + 0.00001], [measurement.y + 0.00001], [measurement.speed]];
        await measurement.save();
        await user1.measurements.push(measurement);
        measurementCounter++;
    }
    await user1.save();

    let measurement1 = new Measurement({ user: user2.id, x: 39.67284741191456, y: 20.855785109192706, speed: 2.5 });
    measurement1.xHatNew = [[measurement1.x], [measurement1.y], [measurement1.speed]];

    let measurement2 = new Measurement({ user: user2.id, x: 39.672772363589985, y: 20.855996595106472, speed: 2.5 });
    measurement2.xHatNew = [[measurement2.x], [measurement2.y], [measurement2.speed]];

    let measurement3 = new Measurement({ user: user2.id, x: 39.672751718543545, y: 20.856187031939164, speed: 2.5 });
    measurement3.xHatNew = [[measurement3.x], [measurement3.y], [measurement3.speed]];

    let measurement4 = new Measurement({ user: user2.id, x: 39.67265468674271, y: 20.856516943635235, speed: 2.5 });
    measurement4.xHatNew = [[measurement4.x], [measurement4.y], [measurement4.speed]];

    let measurement5 = new Measurement({ user: user2.id, x: 39.67265881575828, y: 20.856811986615458, speed: 2.5 });
    measurement5.xHatNew = [[measurement5.x], [measurement5.y], [measurement5.speed]];

    let measurement6 = new Measurement({ user: user2.id, x: 39.67272900898535, y: 20.85709361855113, speed: 2.5 });
    measurement6.xHatNew = [[measurement6.x], [measurement6.y], [measurement6.speed]];

    let measurement7 = new Measurement({ user: user2.id, x: 39.67275791205814, y: 20.857195542489755, speed: 2.5 });
    measurement7.xHatNew = [[measurement7.x], [measurement7.y], [measurement7.speed]];

    let measurement8 = new Measurement({ user: user2.id, x: 39.67283636319471, y: 20.857501314305622, speed: 2.5 });
    measurement8.xHatNew = [[measurement8.x], [measurement8.y], [measurement8.speed]];

    let measurement9 = new Measurement({ user: user2.id, x: 39.67286113721932, y: 20.857605920453157, speed: 2.5 });
    measurement9.xHatNew = [[measurement9.x], [measurement9.y], [measurement9.speed]];

    let measurement10 = new Measurement({ user: user2.id, x: 39.67298913620495, y: 20.85796533644725, speed: 2.5 });
    measurement10.xHatNew = [[measurement10.x], [measurement10.y], [measurement10.speed]];

    await measurement1.save();
    await measurement2.save();
    await measurement3.save();
    await measurement4.save();
    await measurement5.save();
    await measurement6.save();
    await measurement7.save();
    await measurement8.save();
    await measurement9.save();
    await measurement10.save();

    await user2.measurements.push(measurement1, measurement2, measurement3, measurement4, measurement5, measurement6, measurement7, measurement8, measurement9, measurement10);
    await user2.save();
}

seedDB();
console.log("Seeding done!");