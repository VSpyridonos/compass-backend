const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const matrixMultiplication = require('matrix-multiplication');
let mul = matrixMultiplication()(2);
var linearAlgebra = require('linear-algebra')(),     // initialise it
    Vector = linearAlgebra.Vector,
    Matrix = linearAlgebra.Matrix;


const math = require('mathjs');

const User = require('./models/user');
const Input = require('./models/input');
const Tour = require('./models/tour');
const Point = require('./models/point');
const Measurement = require('./models/measurement');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));

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










// Kalman-Filter

app.get('/kalman-filter', async (req, res) => {
    await User.deleteMany({});
    await Input.deleteMany({});

    const user1 = new User({ username: 'giannakis5', name: 'giannis', email: 'giannis@gmail.com' });
    const user2 = new User({ username: 'takis13', name: 'takis', email: 'takis@gmail.com' });
    const user3 = new User({ username: 'patatakis28', name: 'patatakis', email: 'patatakis@gmail.com' });

    await user1.save();
    await user2.save();
    await user3.save();

    const measurement1 = new Measurement({ user: user1.id, x: 50.124, y: 24.156, speed: 4.3, isFirst: true });

    await measurement1.save();

    const results = await kalmanFilter(measurement1);
    console.log(results);


    res.render('kalman-filter', { results });
})



async function kalmanFilter(measurement) {

    let xHat;
    let xHatNew; // = new Matrix prwta
    let P;
    let Q;
    let R;
    let t;
    let dt;
    let A;
    let I;
    let K;
    let H;

    async function initialize() {

        xHat = math.matrix([[measurement.x], [measurement.y], [measurement.speed]])
        xHatNew = math.zeros(3, 1);
        t = 0;
        dt = 1;

        P = [[0.1, 0.1, 0.1], [0.1, 10000, 10], [0.1, 10, 100]];   // NA ALLAKSOUME TIMES
        Q = [[0.225, 0.45, 0], [0.45, 0.9, 0], [0, 0, 0]];
        //R = [[15]];
        R = math.identity(3);
        //H = [[1, 0, 0]];
        H = math.identity(3);
        A = [[1, dt, 0], [0, 1, dt], [0, 0, 1]];
        I = math.identity(3);
        K = math.identity(3);
        measurement.isFirst = false;

    }

    async function update(z) {
        // Time-update
        xHatNew = math.multiply(A, xHat);
        P = math.add(math.multiply(math.multiply(A, P), math.transpose(A)), Q);

        console.log('xHatNew=', xHatNew);
        console.log('P=', P);

        // Measurement-update
        // let factor1 = P.dot(math.inv(H))
        // let factor2 = (H.dot(P)).dot(math.inv(H))
        // K = factor1.dot(math.inv(factor2.plus(R)));

        // K = (P.dot(H.trans())).dot(math.inv(((H.dot(P)).dot(H.trans())).plus(R)));

        // let PHT = math.multiply(P, math.transpose(H));
        // let HPHT = math.multiply(H, PHT);
        // let plusR = math.add(HPHT, R);
        // let inversePlusR = math.inv(plusR);

        // K me H
        // K = math.multiply(PHT, inversePlusR);

        // K xwris H
        // K = math.multiply(P, math.inv(math.add(P, R)));

        //XWRIS H

        xHatNew = math.add(xHatNew, math.multiply(K, math.subtract(z, xHatNew)));

        P = math.multiply(math.subtract(I, K), P);

        // ME H

        // xHatNew = math.add(xHatNew, math.multiply(K, math.subtract(z, math.multiply(H, xHatNew))));

        // P = math.multiply(math.subtract(I, math.multiply(K, H)), P);

        // Initialize next iteration
        console.log(`xHat = ${xHat}, xHatNew = ${xHatNew}`)
        xHat = xHatNew;
        console.log(`xHat = ${xHat}, xHatNew = ${xHatNew}`)
        t = t + dt;
    }

    if (measurement.isFirst) await initialize();

    let z = [[measurement.x], [measurement.y], [measurement.speed]];
    await update(z);

    return xHat;
}













app.get('/', async (req, res) => {
    await User.deleteMany({});
    await Point.deleteMany({});
    await Tour.deleteMany({});

    const user1 = new User({ username: 'giannakis5', name: 'giannis', email: 'giannis@gmail.com' });
    const user2 = new User({ username: 'takis13', name: 'takis', email: 'takis@gmail.com' });
    const user3 = new User({ username: 'patatakis28', name: 'patatakis', email: 'patatakis@gmail.com' });

    const point1 = new Point({ user: user1.id, geometry: { type: 'Point', coordinates: [51.092358, 40.612349] } });
    const point2 = new Point({ user: user2.id, geometry: { type: 'Point', coordinates: [63.123551, 23.613236] } });
    const point3 = new Point({ user: user3.id, geometry: { type: 'Point', coordinates: [25.521351, 17.573957] } });

    await point1.save();
    await point2.save();
    await point3.save();

    const tour1 = new Tour({ user: user1.id });
    const tour2 = new Tour({ user: user2.id });
    const tour3 = new Tour({ user: user3.id });

    tour1.points.push(point1);
    tour2.points.push(point2);
    tour3.points.push(point3);

    await tour1.save();
    await tour2.save();
    await tour3.save();

    user1.currentTour = tour1.id;
    user2.currentTour = tour2.id;
    user3.currentTour = tour3.id;

    await user1.save();
    await user2.save();
    await user3.save();

    const users = await User.find()
    const tours = await Tour.find();
    res.render('tours', { users, tours });

});



app.get('/home', (req, res) => {
    res.render('home');
});


const port = 3000;

app.listen(port, () => console.log(`Server running on port ${port}`));