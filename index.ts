const express = require('express');
const app = express();
const PORT = 3000;

const fs = require('fs');
const DB_FILEPATH = './storage/db.json';

// ------------------ MULTER FOR FILE UPLOAD --------------------------//
const multer  = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${__dirname}/storage/uploads/`);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });
// ---------------------------------------------------------------------//

app.get('/user', (req, res) => {
  const SERVER_URL = req.protocol + '://' + req.get('host');
  const db = require(DB_FILEPATH);
  const users = db.users.map(user => {
    user.image = `${SERVER_URL}/uploads/${user.image}`;
    return user;
  })

  res.json(users);
});

// or upload.array('profile') if multiple files
// access filenames from req.files
app.post('/user', upload.single('profile'), (req, res) => {
  const db = require(DB_FILEPATH);
  db.users.push({
    user_id: req.body.user_id,
    name: req.body.name,
    image: req.file.filename
  });

  fs.writeFile(`${DB_FILEPATH}`, JSON.stringify(db), (err) => {
    if (err) throw err;
    res.json({users: db.users});
  });
});

// multer can't handle file uploading for PUT request
// if you want to update with file(s), use POST request instead
app.put('/user', (req, res) => {
  const db = require(DB_FILEPATH);
  const userIndex = db.users.findIndex(user => user.user_id === req.query.user_id);
  if (userIndex >= 0) {
    db.users[userIndex].name = req.query.name;
  }

  fs.writeFile(`${DB_FILEPATH}`, JSON.stringify(db), (err) => {
    if (err) throw err;
    res.json(db.users[userIndex]);
  });
});

app.delete('/user', (req, res) => {
  const db = require(DB_FILEPATH);
  db.users = db.users.filter(user => user.user_id !== req.query.user_id);
  fs.writeFile(`${DB_FILEPATH}`, JSON.stringify(db), (err) => {
    if (err) throw err;
    res.send('Success');
  });
});

app.get('/uploads/:file', (req, res) => {
  res.sendFile(`${__dirname}/storage/uploads/${req.params.file}`);
});

app.listen(PORT, () => console.log(`App listening on port ${PORT}!`));