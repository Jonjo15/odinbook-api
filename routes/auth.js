const express = require("express")
const router = express.Router()
const User = require("../models/user")
const passport = require("passport");
const issueJWT = require("../util/utils").issueJWT;
const bcrypt = require("bcryptjs")
const { body, validationResult } = require("express-validator");



router.get("/protected", passport.authenticate('jwt', { session: false }), (req, res) => {
    res.status(200).json({ success: true, msg: req.user});
  });

router.post('/facebook/token', passport.authenticate('facebook-token', {session: false}), (req, res) => {
  res.status(200).json({success: true, user: req.user})
}); // function (req, res) {
  //   // do something with req.user
  //   res.send(req.user? 200 : 401);
  // }
  // facebookOAuth: async (req, res, next) => {
  //   // Generate token
  //   const token = signToken(req.user);
  //   res.status(200).json({ token });
  // },
router.post("/login", async (req, res, next) => {
    try {
        // Check for existing user
        const user = await User.findOne({ email: req.body.email });
        if (!user) throw Error('User does not exist');
    
        const isMatch = await bcrypt.compare(req.body.password , user.password);
        if (!isMatch) throw Error('Invalid credentials');
    
        const {token} = issueJWT(user)
        if (!token) throw Error('Couldnt sign the token');
    
        res.status(200).json({
          token,
          user: {
            id: user._id,
            first_name: user.first_name,
            family_name: user.family_name,
            email: user.email
          }
        });
      } catch (e) {
        res.status(400).json({ msg: e.message });
      }
});

router.post("/register", [
    body('first_name', 'First Name required').trim().isLength({ min: 1 }).escape(),
    body('family_name', 'Family Name required').trim().isLength({ min: 1 }).escape(),
    body('email', 'Email required').trim().isLength({ min: 1 }).escape(),
    body("email","Email Addres must be valid").normalizeEmail().isEmail(),
    body('password', 'Password required').trim().isLength({ min: 4 }).escape(),
  
    async (req, res, next) => {
  
      const errors = validationResult(req);
  
      
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.status(401).json({success: false, msg: "input error"})
        return;
      }
      try {
        const user = await User.findOne({ email: req.body.email });
        if (user) throw Error('User already exists');
    
    
        const hash = await bcrypt.hash(req.body.password, 10);
        if (!hash) throw Error('Something went wrong hashing the password');
    
        const newUser = new User({
          first_name: req.body.first_name,
          family_name: req.body.family_name,
          email: req.body.email,
          password: hash
        });
    
        const savedUser = await newUser.save();
        if (!savedUser) throw Error('Something went wrong saving the user');
    
        const {token} = issueJWT(savedUser)
    
        res.status(200).json({
          token,
          user: {
            id: savedUser._id,
            first_name: savedUser.first_name,
            family_name: savedUser.family_name,
            email: savedUser.email
          }
        });
      } catch (e) {
        res.status(400).json({ error: e.message });
      }
  }]);

module.exports = router