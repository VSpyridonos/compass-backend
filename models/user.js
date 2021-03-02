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
    }]
});

module.exports = mongoose.model('User', UserSchema);