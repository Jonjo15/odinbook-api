var express = require('express');
var router = express.Router();
const passport = require("passport")
const User = require("../models/user")
const Post = require("../models/post")
const Notification = require("../models/notification")
router.use(passport.authenticate('jwt', { session: false }))

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({success: true, msg: "Hello"})
});

router.get("/home", async(req, res) => {
  //TODO:
  // const {friends} = req.user;
  let timeline = [];
  try {
    const yourPosts = await Post.find({creator: req.user._id}).populate({ 
      path: 'comments',
      populate: [{
       path: 'creator',
       select: 'first_name family_name _id'
      //  model: 'Component'
      }] 
    }).limit(4).sort({ "createdAt": -1 })
    //TODO: FINISH THIS QUERY
    const friendPosts = await Post.find({})
    res.status(200).json({success: true, yourPosts})
  }
  catch(e) {
    res.status(400).json({success: false, msg: e.message})
  }
})

module.exports = router;
