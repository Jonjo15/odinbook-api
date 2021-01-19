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

router.post("/login", async (req, res, next) => {
    try {
        const user = await User.findOne({email: req.body.email})
            if (!user) {
                return res.status(401).json({success: false, msg: "couldnt find the user"})
            }
            else {
                const result = await bcrypt.compare(req.body.password, user.password)
                if (result) {
                    const tokenObject = issueJWT(user)
                    res.status(200).json({success: true, user, token: tokenObject.token, msg:"Logged in succesfully"})
                }
                else {
                    res.status(401).json({success: false, msg: "invalid credentials"})
                }
            }
    }
    catch (err) {
        next(err)
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

        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
            // if err, do something
            // otherwise, store hashedPassword in DB
            const user = new User({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            email: req.body.email,
            password: hashedPassword,
            })
            const result = await user.save()  
            const userObj = {
                first_name: result.first_name,
                family_name: result.family_name,
                email: result.email,
                id: result._id
            }
            let tokenObject = issueJWT(result)
            return res.json({success: true, user: userObj, token: tokenObject.token, msg: "user created"})
            }
        }
    }
  }]);

module.exports = router