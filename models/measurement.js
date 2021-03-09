const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MeasurementSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    dt: Number,
    x: Number,     // geolocationCoordinatesInstance.latitude
    y: Number,     // geolocationCoordinatesInstance.longitude
    speed: Number,  // geolocationCoordinatesInstance.speed
    A: [Number],    // pinakas katastasis metavasis
    Q: [Number],    // avevaiotita sxetika me tin perigrafi tou systimatos
    R: [Number],    // geolocationCoordinatesInstance.accuracy
    P: [Number],    // avevaiotita ektimisis
    K: [Number],    // Kalman Gain = varytita se kathe metrisi
    I: [Number],    // Identity Matrix
    t0: Number,
    t: Number,
    isFirst: Boolean
});

module.exports = mongoose.model('Measurement', MeasurementSchema);