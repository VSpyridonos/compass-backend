const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InputSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    xpos: Number,
    ypos: Number,
    speed: Number
});

module.exports = mongoose.model('Input', InputSchema);