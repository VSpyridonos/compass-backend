const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const amqp = require('amqplib');
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

// Consumer
async function connectRabbit(){
    try{
        const connection = await amqp.connect("amqp://localhost:5672");
        const channel = await connection.createChannel();
        var queue = "kalman"
        const function_queue = await channel.assertQueue(queue, {durable: false});

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

        channel.consume(queue, function (message) {
                const input = JSON.parse(message.content.toString());
                console.log("Received %s", message.content.toString());
                return input;

            }, {noAck: true});
    }
    catch(ex){
        console.log(ex);
    }
}


// Kalman-Filter
app.get('/kalman-filter', async (req, res) => {
    await User.deleteMany({});
    await Input.deleteMany({});
    await Measurement.deleteMany({});

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


    // Make it unique for each user
    let measurementCounter = 0;
    let measurement;
    var input = connectRabbit();

    // ************** RabbitMQ communication cycle ******************
    let user;
    while (measurementCounter < 2) {


        // Receive measurement from mobile app and create measurement object using the received values, increment measurementCounter

        if (measurementCounter === 0) {
            //measurement = new Measurement({ user: user1.id, x: 50.124, y: 24.156, speed: 4.3, isFirst: true, dt: 1 });
            
            //input is in JSON format probably, so the values we want are stored in this way.
            measurement = new Measurement({user: input[user][id], x: input[xpos], y: input[ypos], speed: input[speed]});
            measurement.xHatOriginal = [[measurement.x], [measurement.y], [measurement.speed]];
            measurement.xHat = [[measurement.x], [measurement.y], [measurement.speed]];


            // Find current user (not needed after authentication) and access their measurement's details
            user = await User.findById(user1.id).populate({
                path: 'measurements',
                populate: {
                    path: 'measurement'
                }
            });
            // Add this measurement to user's measurements
            await kalmanFilter(measurement);
            user.measurements.push(measurement);
            user.save();

        }
        // If measurement is not the first one, xHatOriginal = previous measurement's xHatNew
        else {

            measurement = new Measurement({ user: user.id, x: 51.126, y: 25.167, speed: 4.4, isFirst: false, dt: 2 });
            measurement.xHatOriginal = [[measurement.x], [measurement.y], [measurement.speed]];
            measurement.xHat = user.measurements[measurementCounter - 1].xHatNew;

            await kalmanFilter(measurement);
            // Add this measurement to user's measurements
            user.measurements.push(measurement);
            user.save();
        }
        measurementCounter++;
        await measurement.save();


        // Call kalman-filter with measurement

    }


    // **************************************************************

    // Find all measurements
    const results = await Measurement.find({});

    res.render('kalman-filter', { results });
})


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

app.get('/', async (req, res) => {
    await User.deleteMany({});
    await Point.deleteMany({});
    await Tour.deleteMany({});

    const user1 = new User({ username: 'giannakis5', name: 'giannis', email: 'giannis@gmail.com' });
    const user2 = new User({ username: 'takis13', name: 'takis', email: 'takis@gmail.com' });
    const user3 = new User({ username: 'patatakis28', name: 'patatakis', email: 'patatakis@gmail.com' });
    const user4 = new User({ username: 'aris123', name: 'aris', email: 'arispap@gmail.com' });
    const user5 = new User({ username: 'georgia22', name: 'georgia', email: 'georgia2@gmail.com' });
    const user6 = new User({ username: 'vasilis124', name: 'vasilis', email: 'vasilis21@gmail.com' });
    const user7 = new User({ username: 'vanessarocks', name: 'vanessa', email: 'vanessarocks@gmail.com' });

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
    await user4.save();
    await user5.save();
    await user6.save();
    await user7.save();

    const users = await User.find()
    const tours = await Tour.find();
    res.render('tours', { users, tours });
});

app.get('/home', (req, res) => {
    res.render('home');
});

const port = 3000;

app.listen(port, () => console.log(`Server running on port ${port}`));