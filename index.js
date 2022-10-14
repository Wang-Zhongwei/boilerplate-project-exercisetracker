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
  let date = req.body.date === "" ? new Date() : new Date(req.body.date);

  User.findById(userId, (err, user) => {
    if (err) {
      console.error(err);
      return res.send("Unknown userId");
    }

    // if found existing user, create new exercise for the user
    let newExercise = new Exercise({
      userId: userId,
      description: description,
      duration: duration,
      date: date
    });

    // save new exercise
    newExercise.save((err, data) => {
      if (err) return console.error(err);
      res.json({
        username: user.username,
        description: data.description,
        duration: data.duration,
        date: data.date.toDateString(),
        _id: data.userId
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

// get all exercises for a specific user with from, to and limit parameters
app.get("/api/users/:_id/logs", (req, res) => {
  let userId = req.params._id;
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;

  // correct this line
  User.findById(userId, (err, user) => {
    if (err) {
      console.error(err);
      return res.send("Unknown userId");
    }
    
    Exercise.find({ userId: userId }, (err, exercises) => {
      if (err) return console.error(err);

      // filter exercises by from and to dates
      if (from && to) {
        exercises = exercises.filter(
          (exercise) =>
            exercise.date >= new Date(from) && exercise.date <= new Date(to)
        );
      }

      // limit the number of exercises
      if (limit) {
        exercises = exercises.slice(0, limit);
      }

      res.json({
        _id: user._id,
        username: user.username,
        count: exercises.length,
        log: exercises.map((exercise) => ({
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString(),
        })),
      });
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
