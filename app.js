//requires
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

//setup app
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

//setup session data, ordering from here is important
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//connect to database and create user schema
mongoose.connect(process.env.DB_ADDRESS, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

//ordering below is important here
const userSchema = new mongoose.Schema({
    username: {type: String},
    googleId: {type: String},
    facebookId: {type: String},
    secret: {type: String}
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//create model
const User = mongoose.model("User", userSchema);

//passport setup - serialise functions are more general
passport.use(User.createStrategy());
passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});


//for google oauth logins
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb){
    User.findOrCreate({googleId: profile.id}, function(err, user){
        console.log(profile);
        return cb(err, user);
    });   
}));

//FaceBook
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//routes
app.get("/", function (req, res) {
    res.render("home");
});

//login with google
app.get("/auth/google", passport.authenticate("google", { scope: ["profile"]}));

app.get("/auth/google/secrets", passport.authenticate("google", { failureRedirect: "/login"}), function(req, res){
    res.redirect("/secrets");
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function (req, res) {
    res.render("login");
});

//either sends to secrets or login depending on successful authentication
app.post("/login", passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login"
}), function(req, res){

});


app.get("/register", function (req, res) {
    res.render("register");
});

//registers a user, or redirects to registration if there is an error

app.post("/register", function (req, res) {

    const username = req.body.username;
    const password = req.body.password;

    User.register({username: username}, password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

//secret page based on whether the user is logged in or not
//grabs any submitted secrets and displays them
app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){

        User.find({secret: {$ne: null}}, function(err, users){
            const secrets = [];
            
            users.forEach((user) => {
                secrets.push(user.secret);
            });

            res.render("secrets", {secrets: secrets});
        }); 
    } else {
        res.redirect("/login");
    }
});

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

//adds a secret
app.post("/submit", function(req, res){
    const secret = req.body.secret;
    const id = req.user.id;

    User.findById(id, function(err, user){
        if(err){
            console.log(err)
        } else {
            user.secret = secret;
            user.save(function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

app.listen(3000, () => {
    console.log("Server listening on port 3000");
});
