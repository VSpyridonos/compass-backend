const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const Item = require('./models/item')

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

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/items', async (req, res) => {
    await Item.deleteMany({});
    const item1 = new Item({ title: 'antikeimeno1', coordinates: 1234 });
    const item2 = new Item({ title: 'antikeimeno2', coordinates: 4545 });
    await item1.save();
    await item2.save();
    const items = await Item.find();

    res.render('index', { items });
})

const port = 3000;

app.listen(port, () => console.log(`Server running on port ${port}`));