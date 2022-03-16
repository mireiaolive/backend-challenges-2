const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const { Schema } = mongoose;

const ExerciseSchema = new Schema({
    userId: { type: String, required: true },
    description: String,
    duration: Number,
    date: Date,
});

const UserSchema = new Schema({
    username: String,
});

const User = mongoose.model("User", UserSchema);
const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", (req, res) => {
    User.find({}, (err, data) => {
        if (!data) {
            res.send("There is an error, try again: ", err);
        } else {
            res.json(data);
        }
    });
});

app.get("/api/users/:_id/logs", (req, res) => {
    const id = req.body["_id"] || req.params._id;
    var fromDate = req.query.from;
    var toDate = req.query.to;
    var limit = req.query.limit;

    if (fromDate) {
        fromDate = new Date(fromDate);
        if (fromDate == "Invalid Date") {
            res.json("Invalid Date Entered");
            return;
        }
    }

    if (toDate) {
        toDate = new Date(toDate);
        if (toDate == "Invalid Date") {
            res.json("Invalid Date Entered");
            return;
        }
    }

    if (limit) {
        limit = new Number(limit);
        if (isNaN(limit)) {
            res.json("Invalid Limit Entered");
            return;
        }
    }

    User.findOne({ _id: id }, (error, data) => {
        if (error) {
            res.json("Invalid UserID");
            return console.log(error);
        }
        if (!data) {
            res.json("Invalid UserID");
        } else {
            const usernameFound = data.username;
            var objToReturn = { _id: id, username: usernameFound };

            var findFilter = { username: usernameFound };
            var dateFilter = {};

            if (fromDate) {
                objToReturn["from"] = fromDate.toDateString();
                dateFilter["$gte"] = fromDate;
                if (toDate) {
                    objToReturn["to"] = toDate.toDateString();
                    dateFilter["$lt"] = toDate;
                } else {
                    dateFilter["$lt"] = Date.now();
                }
            }

            if (toDate) {
                objToReturn["to"] = toDate.toDateString();
                dateFilter["$lt"] = toDate;
                dateFilter["$gte"] = new Date("1960-01-01");
            }

            if (toDate || fromDate) {
                findFilter.date = dateFilter;
            }

            Exercise.count(findFilter, (error, data) => {
                if (error) {
                    res.json("Invalid Date Entered");
                    return console.log(error);
                }

                var count = data;
                if (limit && limit < count) {
                    count = limit;
                }
                objToReturn["count"] = count;

                Exercise.find(findFilter, (error, data) => {
                    if (error) return console.log(error);

                    var newArray = [];
                    var newObject = {};
                    var count = 0;

                    data.forEach(function (val) {
                        count += 1;
                        if (!limit || count <= limit) {
                            newObject = {};
                            newObject.description = val.description;
                            newObject.duration = val.duration;
                            newObject.date = val.date.toDateString();
                            console.log(newObject);
                            newArray.push(newObject);
                        }
                    });
                    objToReturn["log"] = newArray;
                    res.json(objToReturn);
                });
            });
        }
    });
});

app.post("/api/users", (req, res) => {
    console.log("post request working: ", req.body);
    const newUser = new User({
        username: req.body.username,
    });
    newUser.save((err, result) => {
        if (err || !result) {
            res.send("There is an error, try again");
        } else {
            res.json(result);
        }
    });
});

app.post("/api/users/:id/exercises", (req, res) => {
    console.log("post request working: ", req.body);
    const id = req.params.id;
    const { description, duration, date } = req.body;
    User.findById(id, (err, entryData) => {
        if (err || !entryData) {
            res.send("There is an error, try again");
        } else {
            const newExercice = new Exercise({
                userId: id,
                description,
                duration,
                date: new Date(date),
            });
            newExercice.save((err, data) => {
                if (err || !data) {
                    res.send("There is an error, try again");
                } else {
                    const { description, duration, date, _id } = data;
                    res.json({
                        username: entryData.username,
                        description,
                        duration,
                        date: date.toDateString(),
                        _id: entryData.id,
                    });
                }
            });
        }
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
