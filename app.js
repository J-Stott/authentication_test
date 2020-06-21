require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const shajs = require("sha.js");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = shajs('sha256').update('42').digest('hex');

    User.findOne({email: username, password: password}, function(err, user){
        if(err){
            console.log(err);
        }

        if(user != null){
            res.render("secrets");
        } else {
            res.render("login");
        }
    });
});


app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {

    const username = req.body.username;
    const password = shajs('sha256').update('42').digest('hex');

    const newUser = new User({
        email: username,
        password: password
    });

    newUser.save(function(err){
        if(!err) {
            res.render("secrets");
        } else {
            console.log(err);
        }
    });
});

app.get("/logout", function (req, res) {
    res.render("home");
});

app.listen(3000, () => {
    console.log("Server listening on port 3000");
});
