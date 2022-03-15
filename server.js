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
