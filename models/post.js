const mongoose = require('mongoose');

const Post = mongoose.model('Post', {
  text: {
    type: String,
    required: true,
    minlength: 3,
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
  type: {
    type: String,
    required: true
  }
});

module.exports = {
  Post
}
