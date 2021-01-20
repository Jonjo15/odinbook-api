var express = require('express');
var router = express.Router();
const Post = require("../models/post")
const User = require("../models/user")
const passport = require("passport");
const { body, validationResult } = require("express-validator");


router.use(passport.authenticate('jwt', { session: false }))
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

//Create a post
router.post("/posts", [
  body('body', 'Post must not be empty').trim().isLength({ min: 1 }).escape(),
  async (req, res, next) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.status(401).json({success: false, msg: "input error"})
        return;
      }

      const newPost = new Post({
        body: req.body.body,
        creator: req.user._id
      })
      try {
        const post = await newPost.save()
        if (!post) throw Error('Something went wrong creating a new post');

        return res.status(200).json({success: true, post, msg:"post created successfully"})
      }
      catch (e) {
        res.status(400).json({success: false,  msg: e.message });
      }
  }
]);

router.delete("/posts/:postId", async (req, res, next) => {
  const post = await Post.findById(req.params.postId)
  if(!post) throw Error("Post not found")
  if (!post.creator.equals(req.user._id)) {
    return res.status(403).json({success: false, msg: "Can't delete someone else's post"})
  }
  try {
    const response = await post.delete()
    res.status(200).json({success:true, response,  msg: "Post deleted successfully"})
  }
  catch(e) {
    res.status(400).json({success: false, msg: e.message})
  }
})



module.exports = router;
