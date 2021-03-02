const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TourSchema = new Schema({
    guard: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    points: [{
        type: Schema.Types.ObjectId,
        ref: 'Point'
    }],
    date: Date
});

module.exports = mongoose.model('Tour', TourSchema);