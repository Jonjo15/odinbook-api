const JwtStrategy = require('passport-jwt').Strategy,
     ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require("../models/user")
const FacebookTokenStrategy = require('passport-facebook-token');
require("dotenv").config()

var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_KEY;

module.exports = (passport) => {
    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    User.findOne({_id: jwt_payload.sub}, function(err, user) {
            if (err) {
                return done(err, false);
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
                // or you could create a new account
            }
        });
    }));
    passport.use(new FacebookTokenStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        fbGraphVersion: 'v9.0'
    }, (accessToken, refreshToken, profile, done) =>  {
        console.log(profile)
        User.findOne({facebookId: profile.id}, async(err, user) => {
            if(err) {
                return done(err, false)
            }
            if (user) {
                return done(null, user)
            }
            else {
                const newUser = new User({
                    facebookId: profile.id,
                    email: profile.emails[0].value,
                    profile_pic_url: profile.photos[0].value,
                    first_name: profile.name.givenName,
                    family_name: profile.name.familyName
                })
                try {
                    const savedUser = await newUser.save()
                    if(!savedUser) throw Error("Something went wrong with creating new user")
                    return done(null, savedUser)
                }
                catch(e) {
                    return done(e, false)
                }
                
                
            }
        })
        // User.findOrCreate({facebookId: profile.id}, function (error, user) {
        // return done(error, user);
        // });
    }
    ));  
}
