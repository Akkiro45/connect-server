const mongoose = require('mongoose');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  tokens: [
    {
      access: {
        type: String,
        required: true
      },
      token: {
        type: String,
        required: true
      }
    }
  ]
});

AdminSchema.methods.generateAuthToken = function() {
  const admin = this;
  const access = 'auth';
  const token = jwt.sign({_id: admin._id.toHexString(), access}, process.env.JWT_SECRET).toString();
  admin.tokens = admin.tokens.concat([{access, token}]);
  return admin.save().then(() => {
    return token;
  });
};

AdminSchema.methods.removeToken = function(token) {
  const admin = this;
  return admin.update({
    $pull: {
      tokens: {
        token
      }
    }
  });
};

AdminSchema.statics.findByToken = function(token) {
  const Admin = this;
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    // return new Promise((resolve, reject) => {
    //   reject();
    // });
    return Promise.reject('Query error.');
  }

  return Admin.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });

}

AdminSchema.pre('save', function(next){
  const admin = this;

  if(admin.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(admin.password, salt, (err, hash) => {
        admin.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

const Admin = mongoose.model('Admin', AdminSchema);

module.exports = {
  Admin
}
