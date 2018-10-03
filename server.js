require('./config/config.js');
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const bcrypt = require('bcryptjs');
// https://git.heroku.com/glacial-basin-97045.git
// https://glacial-basin-97045.herokuapp.com/
// https://glacial-basin-97045.herokuapp.com/
// https://connect-22b11.firebaseapp.com/
const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');
const {Admin} = require('./models/admin');
const {Post} = require('./models/post');
const {authenticate, authenticateAdmin} = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

// Routs
// User ----------------------------
// POST /user/signup
app.post('/user/signup', (req, res) => {
  const body = _.pick(req.body, ['name', 'sapid', 'email', 'password', 'dept']);
  const user = new User(body);
  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send({data: user,token});
  }).catch((e) => {
    res.status(400).send(e);
  });
});
// POST /admin/user/signup
app.post('/admin/user/signup', (req, res) => {
  const body = _.pick(req.body, ['name', 'sapid', 'email', 'password', 'dept']);
  body.type = 'staff';
  body.wallFlag = true;
  const user = new User(body);
  user.save().then(() => {
    res.send({data: user});
  }).catch((e) => {
    res.status(400).send(e);
  });
});


// GET /user/me
app.get('/user/me', authenticate, (req, res) => {
  res.send(req.user);
});

// POST /user/login
app.post('/user/login', (req, res) => {
  const userObj = _.pick(req.body, ['sapid', 'password'])
  User.findOne({sapid: userObj.sapid}).then((doc) => {
    bcrypt.compare(userObj.password, doc.password, (err, r) => {
      if(err) {
        return res.status(400).send('Invalid Password.');
      }
      if(r) {
        doc.generateAuthToken().then((token) => {
              res.header('x-auth', token).send({data: doc,token});
            });
        // res.header('x-auth', doc.tokens[0].token).send(doc);
      } else {
        res.status(401).send('Incorect password.');
      }
    })
  }).catch((e) => {
    res.status(400).send('Invalid ID.');
  });
});

// DELETE /user/me/token
app.delete('/user/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }, (e) => {
    res.status(400).send();
  });
});

// Admin -----------------------------------

// POST /admin/signup
app.post('/admin/signup', (req, res) => {
  const body = _.pick(req.body, ['id', 'password']);
  const admin = new Admin(body);
  admin.save().then(() => {
    return admin.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send({data: admin,token});
  }).catch((e) => {
    res.status(400).send(e);
  });
});

// POST /admin/login
app.post('/admin/login', (req, res) => {
  const adminObj = _.pick(req.body, ['id', 'password'])
  Admin.findOne({id: adminObj.id}).then((doc) => {
    bcrypt.compare(adminObj.password, doc.password, (err, r) => {
      if(err) {
        return res.status(400).send('Invalid Password.');
      }
      if(r) {
        doc.generateAuthToken().then((token) => {
              res.header('x-auth', token).send({data: doc,token});
              // res.header('Access-Control-Expose-Headers', token).send(doc);
            });
        // res.header('x-auth', doc.tokens[0].token).send(doc);
      } else {
        res.status(401).send('Incorect password.');
      }
    })
  }).catch((e) => {
    res.status(400).send('Invalid ID.');
    console.log(e);
  });
});

// GET /admin/me
app.get('/admin/me', authenticate, (req, res) => {
  res.send(req.admin);
});

// DELETE /admin/me/token
app.delete('/admin/me/token', authenticateAdmin, (req, res) => {
  req.admin.removeToken(req.token).then(() => {
    res.status(200).send();
  }, (e) => {
    res.status(400).send();
  });
});


// Post--------------------------------

app.post('/posts', (req, res) => {
  const post = new Post({
    text: req.body.text,
    title: req.body.title,
    createdAt: new Date().getTime(),
    _creator: req.body._id,
    type: 'admin'

  });
  post.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/posts', (req, res) => {
  Post.find().sort({ createdAt: -1 }).then((posts) => {
    res.send({posts});
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/posts/:id', (req, res) => {
  const id = req.params.id;
  if(!ObjectID.isValid(id)) {
    return res.status(400).send(id + " is not valid ID.");
  }
  Post.findOne({ _id: id, _creator: req.body._id}).then((post) => {
    if(!post) return res.status(404).send(id + " Dose not exist.");
    res.status(200).send({post});
  }).catch((e) => res.status(400).send("ERROR"));
});

app.delete('/posts/:id', (req, res) => {
  const id = req.params.id;
  if(!ObjectID.isValid(id)) {
    return res.status(400).send(id + ' is not valid ID.');
  }
  Post.findOneAndRemove({ _id: id }).then((post) => {
    if(!post) return res.status(404).send(id + ' Doen not exist.');
    res.status(200).send({post});
  }).catch((e) => res.status(400).send('ERROR'));
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});

module.exports = {
  app
};
