const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: String,
    name: String,
    email: String,
    currentTour: {
        type: Schema.Types.ObjectId,
        ref: 'Tour'
    },
    previousTours: [{
        type: Schema.Types.ObjectId,
        ref: 'Tour'
    }],

    // Current measurements array. When user presses "STOP" on mobile app, move current measurement array into olderMeasurements
    measurements: [{
        type: Schema.Types.ObjectId,
        ref: 'Measurement'
    }],
    olderMeasurements: [[{
        type: Schema.Types.ObjectId,
        ref: 'Measurement'
    }]]
});

module.exports = mongoose.model('User', UserSchema);