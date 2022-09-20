const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('Message', messageSchema)