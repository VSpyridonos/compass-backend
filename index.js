const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const ejsMate = require('ejs-mate');
const amqp = require('amqplib');
const matrixMultiplication = require('matrix-multiplication');
let mul = matrixMultiplication()(2);
var linearAlgebra = require('linear-algebra')(),
    Vector = linearAlgebra.Vector,
    Matrix = linearAlgebra.Matrix;

const math = require('mathjs');

const User = require('./models/user');
const Input = require('./models/input');
const Measurement = require('./models/measurement');

require('dotenv').config();

const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY;
const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://localhost:27017/dockerApp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

var connection, channel, function_queue;
var queue = "Location Data";

async function initialize() {
    await createConnection();
    await watchQueue();
}

initialize();


async function createConnection() {

    connection = await amqp.connect("amqp://localhost:5672");
    channel = await connection.createChannel();
    function_queue = await channel.assertQueue(queue, { durable: true });
}

// Consumer
async function connectRabbit() {
    try {
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
        channel.consume(queue, function (message) {
            const input = JSON.parse(message.content.toString());
            console.log("Received %s", message.content.toString());
            return input;

        }, { noAck: true });
    }
    catch (ex) {
        console.log(ex);
    }
}

async function watchQueue() {


    let isQueueEmpty = await channel.get(queue);
    if (isQueueEmpty != false) {

        channel.consume(queue, async function (message) {
            const input = JSON.parse(message.content.toString());
            // let user;
            console.log("Received %s", message.content.toString());


            let user = await User.find({ idKey: input.userID }, function (err, docs) {
                console.log(docs)
                let theUser = docs[0];
                let transformedDate = new Date(input.time);
                let measurement = new Measurement({
                    user: theUser._id,
                    x: input.longitude,
                    y: input.latitude,
                    speed: input.speed,
                    idKey: input.userID,
                    date: transformedDate,
                    accurracy: input.accurracy
                });


                measurement.xHatOriginal = [[measurement.x], [measurement.y], [measurement.speed]];
                measurement.xHat = [[measurement.x], [measurement.y], [measurement.speed]];

                kalmanFilter(measurement);


                theUser.measurements.push(measurement);
                theUser.save();
                measurement.save();

                console.log('\n\nThe received measurement has been saved.')
            });




            return input;

        }, { noAck: true });

    }

}




async function kalmanFilter(measurement) {

    // We call states or -n- the number of variables needed to discribe our system.
    // For example, if we need x, y coordinates and speed, n = 3.
    // We call measurements or -m- the number of variables needed to describe our measurement.
    // For example, if our measurement is in the form of x, y coordinates and speed, m = 3.
    // If it was a signle number, m = 1 etc.

    // System State Vectors
    let xHat;	// (dimensions: n X 1)
    let xHatNew;	// (dimensions: n X 1)

    // Covariance Matrices
    let P;	// State Covariance Matrix (dimensions: n X n)
    let Q;	// Process Noise Covariance Matrix (dimensions: n X n)
    let R;	// Measurement Noise Covariance Matrix (dimensions: m X m)

    // Transition Matrices
    let A;	// State Transition Matrix (dimensions: n X n)
    let H;	// Observation Matrix (dimensions: m X n)

    let K;	// Kalman Gain (dimensions: n X m)
    let I;	// Identity Matrix (dimensions: n X n)

    // Time variables
    let t;	// Current time
    let dt;	// Time step

    // All measurements need to access arrays' values
    t = 0;
    dt = 1;	// We assume that our time step is constant.

    // For the initialization of Covariance and Transition matrices
    // we pick the "appropriate values" based on experimentation and
    // community suggestions.

    // Initialize Covariance Matrices with appropriate values.
    P = [[0.1, 0.1, 0.1], [0.1, 10000, 10], [0.1, 10, 100]];
    Q = [[0.225, 0.45, 0], [0.45, 0.9, 0], [0, 0, 0]];
    R = [[15, 0, 0], [0, 15, 0], [0, 0, 15]];

    // Initialize Transition Matrices with appropriate values.
    A = [[1, dt, 0], [0, 1, dt], [0, 0, 1]];
    H = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

    I = math.identity(3);

    async function update(z) {

        // Time-update

        measurement.xHatNew = math.multiply(A, measurement.xHat);	// x(t) = A * x(t-1)

        // For the equation P(t) = A * P(t-1) * A.transpose + Q
        // Calculate factor A * P(t-1)
        let AP = math.multiply(A, P);
        // Calculate factor A * P(t-1) * A.transpose
        let APAT = math.multiply(AP, math.transpose(A));
        // Finally, assemble P
        P = math.add(APAT, Q);

        // Measurement-update

        // For the equation K = P * H.transpose * (H * P * H.transpose + R).inverse
        // Calculate factor P * H.transpose
        let PHT = math.multiply(P, math.transpose(H));
        // Calculate factor H * P * H.transpose
        let HPHT = math.multiply(H, PHT);
        // Calculate factor (H * P * H.transpose + R)
        let plusR = math.add(HPHT, R);
        // Calculate (H * P * H.transpose + R).inverse
        let inversePlusR = math.inv(plusR);
        // Finally, assemble K
        K = math.multiply(PHT, inversePlusR);

        // Debug
        console.log("In function update(), Kalman Gain = ", K);

        // For the equation x(t) = x(t) + K * (z(t) - H*x(t))
        // Calculate factor H * x(t)
        let Hx = math.multiply(H, measurement.xHatNew);
        // Calculate factor z(t) - H*x(t)
        let zMinusHx = math.subtract(z, Hx);
        // Calculate factor K * (z(t) - H*x(t))
        let KzMinusHx = math.multiply(K, zMinusHx);
        // Finally, assemble xHatNew
        measurement.xHatNew = math.add(measurement.xHatNew, KzMinusHx);

        // Debug
        console.log("In function update(), xHatNew = ", xHatNew);

        // For the equation P = (I - K * H) * P
        // Calculate factor K * H
        let KH = math.multiply(K, H);
        // Calculate factor (I - K * H)
        let IMinusKH = math.subtract(I, KH);
        // Finally, assemble P
        P = math.multiply(IMinusKH, P);

        // Debug
        console.log("In function update(), P = ", P);

    }

    // Call update
    await update(measurement.xHatOriginal);

    return
}

app.get('/users/all-users', async (req, res) => {
    const users = await User.find({}).populate({
        path: 'measurements',
        populate: {
            path: 'measurement'
        }
    });

    res.json(users);
});

app.get('/users/:id', async (req, res) => {

    const user = await User.findById(req.params.id);

    // Populate measurements array
    await user.populate({
        path: 'measurements',
        populate: {
            path: 'measurement'
        }
    }).execPopulate();;

    const numberOfOlderMeasurements = user.olderMeasurements.length;

    // Populate all olderMeasurements arrays
    for (let i = 0; i < numberOfOlderMeasurements; i++) {
        await user.populate({
            path: `olderMeasurements.${i}`,
            populate: {
                path: '_id'
            }
        }).execPopulate();
    }

    res.json(user);
});

app.get('/', async (req, res) => {

    const users = await User.find({}).populate({
        path: 'measurements',
        populate: {
            path: 'measurement'
        }
    });

    res.render('index', { users, googleMapsKey })
})

const port = 3000;

app.listen(port, () => console.log(`Server running on port ${port}`));