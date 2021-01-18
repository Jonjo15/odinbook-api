var  FacebookStrategy = require('passport-facebook').Strategy;
const passport = require("passport")
const User = require("../models/user")
require("dotenv").config()

passport.serializeUser(function(user, done) {
    done(null, user);
  });
passport.deserializeUser(function(user, done) {
    done(null, user);
  });
module.exports = (passport) => {
   passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.CALLBACK_URL,
  },
//   function(accessToken, refreshToken, profile, done) {
//     return done(null, profile);
//   }
  function(accessToken, refreshToken, profile, done) {
    // User.findOrCreate(, function(err, user) {
    //   if (err) { return done(err); }
    //   done(null, user);
    // });
  }
));
}