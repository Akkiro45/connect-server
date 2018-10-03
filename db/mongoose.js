const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
      console.log('Connected to MongoDB Server.');
    }).catch((e) => {
      console.log('Unable to connect to MongoDB Server.');
    });

module.exports = {
  mongoose
}
