require('./config/config.js');
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const bcrypt = require('bcryptjs');
const cors = require('cors');


// https://git.heroku.com/glacial-basin-97045.git
// https://glacial-basin-97045.herokuapp.com/
// https://glacial-basin-97045.herokuapp.com/
// https://connect-22b11.firebaseapp.com/
const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');
const {Admin} = require('./models/admin');
const {Post} = require('./models/post');
const {Wall} = require('./models/wall');
const {Question} = require('./models/question');
const {Answer} = require('./models/answer');
const {authenticate, authenticateAdmin} = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(cors());

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
app.get('/user/me/:id', (req, res) => {
  const id = req.params.id;
  User.findById(id).then(user => {
    if(user) {
      return res.send(user);
    }
    res.status(404).send();
  })
    .catch(e => {
     res.status(400).send(e); 
  });
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


// Wall--------------------------------

app.post('/wall', (req, res) => {
  const wall = new Wall({
    text: req.body.text,
    title: req.body.title,
    createdAt: new Date().getTime(),
    _creator: req.body._id,
    type: req.body.type,
    dept: req.body.dept
  });
  wall.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/wall/:dept', (req, res) => {
  const dept = req.params.dept;
  Wall.find({ dept }).sort({ createdAt: -1 }).then((walls) => {
    res.send({walls});
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/wall/:id', (req, res) => {
  const id = req.params.id;
  if(!ObjectID.isValid(id)) {
    return res.status(400).send(id + " is not valid ID.");
  }
  Wall.findOne({ _id: id, _creator: req.body._id}).then((wall) => {
    if(!wall) return res.status(404).send(id + " Dose not exist.");
    res.status(200).send({wall});
  }).catch((e) => res.status(400).send("ERROR"));
});

app.delete('/wall/:id', (req, res) => {
  const id = req.params.id;
  if(!ObjectID.isValid(id)) {
    return res.status(400).send(id + ' is not valid ID.');
  }
  Wall.findOneAndRemove({ _id: id }).then((wall) => {
    if(!wall) return res.status(404).send(id + ' Doen not exist.');
    res.status(200).send({wall});
  }).catch((e) => res.status(400).send('ERROR'));
});


// Question--------------------------------

app.post('/question', (req, res) => {
  const ques = new Question({
    text: req.body.text,
    title: req.body.title,
    createdAt: new Date().getTime(),
    _creator: req.body._id,
    type: req.body.type,
    dept: req.body.dept
  });
  User.findById(ques._creator)
    .then(user => {
      if(!user) {
        res.send(400).send('User not found');
      } else {
        ques.name = user.name;
        console.log(ques);
        flag = true;
        ques.save().then((doc) => {
          console.log(doc);
          res.send(doc);
        }, (e) => {
          res.status(400).send(e);
        });
      }
    })
    .catch(e => {
      res.status(400).send(e);
    });
});

app.get('/questions/:dept', (req, res) => {
  const dept = req.params.dept;
  Question.find({ dept }).sort({ createdAt: -1 }).then((ques) => {
    res.send({ ques });
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/question/:id', (req, res) => {
  const id = req.params.id;
  if(!ObjectID.isValid(id)) {
    return res.status(400).send(id + " is not valid ID.");
  }
  Question.findOne({ _id: id, _creator: req.body._id}).then((ques) => {
    if(!ques) return res.status(404).send(id + " Dose not exist.");
    res.status(200).send({ques});
  }).catch((e) => res.status(400).send("ERROR"));
});

// Answer ------------------
app.post('/answer', (req, res) => {
  const ans = new Answer({
    text: req.body.text,
    createdAt: new Date().getTime(),
    _creator: req.body._id,
    type: req.body.type,
    q_id: req.body.q_id
  });
  // ans.save().then((doc) => {
  //   res.send(doc);
  // }, (e) => {
  //   res.status(400).send(e);
  // });

  User.findById(ans._creator)
    .then(user => {
      if(!user) {
        res.send(400).send('User not found');
      } else {
        ans.name = user.name;
        console.log(ans);
        ans.save().then((doc) => {
          res.send(doc);
        }, (e) => {
          res.status(400).send(e);
        });
      }
    })
    .catch(e => {
      res.status(400).send(e);
    });
});

app.get('/answers/:id', (req, res) => {
  const q_id = req.params.id;
  Answer.find({ q_id }).sort({ createdAt: -1 }).then((ans) => {
    res.send({ans});
  }, (e) => {
    res.status(400).send(e);
  });
});

app.post('/answer/votes/:id', (req, res) => {
  const a_id = req.params.id;
  Answer.findByIdAndUpdate(a_id, { $inc: {[req.body.type]: 1} }, {new: true})
    .then(ans => {
      res.send(ans);
    })
    .catch(e => {
      res.status(400).send(e);
    });
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});

module.exports = {
  app
};
