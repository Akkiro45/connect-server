const mongoose = require('mongoose');

const Answer = mongoose.model('Answer', {
    text: {
        type: String,
        trim: true,
        minlength: 1,
        required: true
    },
    createdAt: {
      type: Number,
      default: null
    },
    _creator: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String
    },
    q_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    like: {
      type: Number,
      default: 0
    },
    dislike: {
      type: Number,
      default: 0
    }
});

module.exports = {
    Answer
}
