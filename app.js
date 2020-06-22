require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    email: {type: String, unique: true, required: true, dropDups: true},
    password: {type: String, required: true},
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
    const password = req.body.password;

    User.findOne({email: username}, function(err, user){
        if(err){
            console.log(err);
        }

        if(user != null){
            bcrypt.compare(password, user.password, function(err, success){
                if(success === true){
                    res.render("secrets");
                } else {
                    res.redirect("/login");
                }
            });
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

    bcrypt.hash(req.body.password, saltRounds, function(err, hash){
        if(!err){
            const newUser = new User({
                email: username,
                password: hash
            });
        
            newUser.save(function(err){
                if(!err) {
                    res.render("secrets");
                } else {
                    console.log(err);
                }
            });
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
