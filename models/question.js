const mongoose = require('mongoose');

const Question = mongoose.model('Question', {
  text: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
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
  dept: {
    type: String,
    required: true
  },
  type: {
    type: String
  }
});

module.exports = {
    Question
}
