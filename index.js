const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

// Middleware
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

// connect to mongodb and set up schema
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
User = mongoose.model("User", new mongoose.Schema({ username: String }));
Exercise = mongoose.model(
  "Exercise",
  new mongoose.Schema({
    username: String,
    userId: String,
    description: String,
    duration: Number,
    date: Date,
  })
);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// create a new user
app.post("/api/users", (req, res) => {
  let username = req.body.username;
  let newUser = new User({ username: username });
  newUser.save((err, data) => {
    if (err) return console.error(err);
    res.json({ username: data.username, _id: data._id });
  });
});

// create a new activity
app.post("/api/users/:_id/exercises", (req, res) => {
  let userId = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;

  User.findById(userId, (err, user) => {
    if (err) return console.error(err);

    // if found existing user, create new exercise for the user
    let newExercise = new Exercise({
      username: user.username,
      userId: userId,
      description: description,
      duration: duration,
      date: date,
    });

    // save new exercise
    newExercise.save((err, data) => {
      if (err) return console.error(err);
      res.json({
        _id: data.userId,
        username: user.username,
        description: data.description,
        duration: data.duration,
        date: data.date.toDateString(),
      });
    });
  });
});

// get all users
app.get("/api/users", (req, res) => {
  User.find({}, (err, users) => {
    if (err) return console.error(err);
    res.json(users);
  });
});

// get all exercises for a specific user
app.get("/api/users/:_id/logs", (req, res) => {
  let userId = req.params._id;
  let from = new Date(req.query.from);
  let to = new Date(req.query.to);
  let limit = req.query.limit;

  // check date
  if (from.toDateString() === 'Invalid Date') 
    from = new Date(0); // 1970 Jan 1
  if (to.toDateString() === 'Invalid Date') 
    to = new Date(); // now
  
  User.findById(userId, (err, user) => {
    if (err) return console.error(err);

    Exercise.find({ userId: userId }, (err, exercises) => {
      if (err) return console.error(err);
      let log = exercises
        .filter((exercise) => {
          return exercise.date >= from && exercise.date <= to;
        })
        .map((exercise) => {
          return {
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date.toDateString(),
          };
        })
        .slice(0, limit === undefined ? exercises.length : limit);

      res.json({
        username: user.username,
        count: log.length,
        _id: user._id,
        log: log,
      });
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
