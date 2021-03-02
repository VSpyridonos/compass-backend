const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const User = require('./models/user');
const Item = require('./models/item');
const Tour = require('./models/tour');
const Point = require('./models/point');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));

mongoose.connect('mongodb://mongo:27017/dockerApp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
})

app.get('/', async (req, res) => {
    await User.deleteMany({});
    await Point.deleteMany({});
    await Tour.deleteMany({});

    const user1 = new User({ username: 'giannakis5', name: 'giannis', email: 'giannis@gmail.com' });
    const user2 = new User({ username: 'takis13', name: 'takis', email: 'takis@gmail.com' });
    const user3 = new User({ username: 'patatakis28', name: 'patatakis', email: 'patatakis@gmail.com' });

    const point1 = new Point({ guard: user1.id, geometry: { type: 'Point', coordinates: [51.092358, 40.612349] } });
    const point2 = new Point({ guard: user2.id, geometry: { type: 'Point', coordinates: [63.123551, 23.613236] } });
    const point3 = new Point({ guard: user3.id, geometry: { type: 'Point', coordinates: [25.521351, 17.573957] } });

    await point1.save();
    await point2.save();
    await point3.save();

    const tour1 = new Tour({ guard: user1.id });
    const tour2 = new Tour({ guard: user2.id });
    const tour3 = new Tour({ guard: user3.id });

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