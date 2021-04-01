const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TourSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    measurements: [{
        type: Schema.Types.ObjectId,
        ref: 'Measurement'
    }]
});

module.exports = mongoose.model('Tour', TourSchema);