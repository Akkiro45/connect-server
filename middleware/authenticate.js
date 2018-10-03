const {User} = require('./../models/user');
const {Admin} = require('./../models/admin');

const authenticate = (req, res, next) => {
  const token = req.header('x-auth');
  User.findByToken(token).then((user) => {
    if(!user) {
      return Promise.reject('User does not found.');
    }
    req.user = user;
    req.token = token;
    next();
  }).catch((e) => {
    res.status(401).end(e);
  });
}

const authenticateAdmin = (req, res, next) => {
  const token = req.header('x-auth');
  Admin.findByToken(token).then((admin) => {
    if(!admin) {
      return Promise.reject('admin does not found.');
    }
    req.admin = admin;
    req.token = token;
    next();
  }).catch((e) => {
    res.status(401).end(e);
  });
}

module.exports = {
  authenticate,
  authenticateAdmin
};
