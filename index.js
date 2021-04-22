const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
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

async function initStuff() {
    await createConnection();
    await doStuff();
}

initStuff();


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

async function doStuff() {


    var isQueueEmpty = await channel.get(queue);
    if (isQueueEmpty != false) {

        channel.consume(queue, async function (message) {
            const input = JSON.parse(message.content.toString());
            // let user;
            console.log("Received %s", message.content.toString());

            if (input.userID === 0) {
                let user = await User.find({ 'username': 'vanessarocks' }, function (err, docs) {
                    let theUser = docs[0];
                    let measurement = new Measurement({
                        user: theUser._id,
                        x: input.longitude,
                        y: input.latitude,
                        speed: input.speed,
                        idKey: input.idKey
                    });
                    console.log("The Measurement that received")


                    measurement.xHatOriginal = [[measurement.x], [measurement.y], [measurement.speed]];
                    measurement.xHat = [[measurement.x], [measurement.y], [measurement.speed]];

                    kalmanFilter(measurement);


                    theUser.measurements.push(measurement);
                    theUser.save();
                    measurement.save();
                });

            }


            return input;

        }, { noAck: true });

    }


    //do not erase that
    // while (true) {

    //     var isQueueEmpty = await channel.get(queue);
    //     while (isQueueEmpty != false) {

    // let user;
    // let userId;
    // let input = await connectRabbit();
    // console.log(input)

    // if (input[userID] === 0) {
    //     user = await User.find({ username: 'vanessarocks' });
    //     userId = user._id;
    //     console.log(user)
    // }

    // let measurement = new Measurement({
    //     user: userId,
    //     x: input[longitude],
    //     y: input[latitude],
    //     speed: input[speed],
    //     idKey: input[userId]
    // });
    // console.log("The Measurement that received")

    // //console.log(measurement)
    // // measurement = new Measurement({ user: input[user][id], x: input[xpos], y: input[ypos], speed: input[speed] });
    // measurement.xHatOriginal = [[measurement.x], [measurement.y], [measurement.speed]];
    // measurement.xHat = [[measurement.x], [measurement.y], [measurement.speed]];

    // kalmanFilter(measurement);
    // // Add this measurement to user's measurements
    // user.measurements.push(measurement);
    // user.save();
    // measurement.save();
    //     }
}


// Kalman-Filter
// app.get('/kalman-filter', async (req, res) => {
//     await User.deleteMany({});
//     await Input.deleteMany({});
//     await Measurement.deleteMany({});

//     const user1 = new User({ username: 'giannakis5', name: 'giannis', email: 'giannis@gmail.com' });
//     const user2 = new User({ username: 'takis13', name: 'takis', email: 'takis@gmail.com' });
//     const user3 = new User({ username: 'patatakis28', name: 'patatakis', email: 'patatakis@gmail.com' });
//     const user4 = new User({ username: 'aris123', name: 'aris', email: 'arispap@gmail.com' });
//     const user5 = new User({ username: 'georgia22', name: 'georgia', email: 'georgia2@gmail.com' });
//     const user6 = new User({ username: 'vasilis124', name: 'vasilis', email: 'vasilis21@gmail.com' });
//     const user7 = new User({ username: 'vanessarocks', name: 'vanessa', email: 'vanessarocks@gmail.com' });

//     await user1.save();
//     await user2.save();
//     await user3.save();
//     await user4.save();
//     await user5.save();
//     await user6.save();
//     await user7.save();


//     // Make it unique for each user
//     let measurementCounter = 0;
//     let measurement;
//     var input = connectRabbit();

//     // ************** RabbitMQ communication cycle ******************
//     let user;
//     while (measurementCounter < 2) {


//         // Receive measurement from mobile app and create measurement object using the received values, increment measurementCounter

//         if (measurementCounter === 0) {
//             //measurement = new Measurement({ user: user1.id, x: 50.124, y: 24.156, speed: 4.3, isFirst: true, dt: 1 });

//             //input is in JSON format probably, so the values we want are stored in this way.
//             measurement = new Measurement({ user: input[user][id], longitude: input[longtitude], latitude: input[latitude], speed: input[speed], accuracy: input[accuracy], date: input[date], time: input[time], idkey:input[userID]});
//             console.log("The Measurement that received")
//             //console.log(measurement)
//             // measurement = new Measurement({ user: input[user][id], x: input[xpos], y: input[ypos], speed: input[speed] });
//             measurement.xHatOriginal = [[measurement.longitude], [measurement.latitude], [measurement.speed]];
//             measurement.xHat = [[measurement.longitude], [measurement.latitude], [measurement.speed]];


//             // Find current user (not needed after authentication) and access their measurement's details
//             user = await User.findById(user1.id).populate({
//                 path: 'measurements',
//                 populate: {
//                     path: 'measurement'
//                 }
//             });
//             // Add this measurement to user's measurements
//             await kalmanFilter(measurement);
//             user.measurements.push(measurement);
//             user.save();

//         }
//         // If measurement is not the first one, xHatOriginal = previous measurement's xHatNew
//         else {

//             measurement = new Measurement({ user: user.id, x: 51.126, y: 25.167, speed: 4.4, isFirst: false, dt: 2 });
//             measurement.xHatOriginal = [[measurement.x], [measurement.y], [measurement.speed]];
//             measurement.xHat = user.measurements[measurementCounter - 1].xHatNew;

//             await kalmanFilter(measurement);
//             // Add this measurement to user's measurements
//             user.measurements.push(measurement);
//             user.save();
//         }
//         measurementCounter++;
//         await measurement.save();


//         // Call kalman-filter with measurement

//     }


//     // **************************************************************

//     // Find all measurements
//     const results = await Measurement.find({});

//     res.render('kalman-filter', { results });
// })


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