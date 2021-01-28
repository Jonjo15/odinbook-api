var express = require('express');
var router = express.Router();
const Post = require("../models/post")
const Comment = require("../models/comment")
const Notification = require("../models/notification")
const User = require("../models/user")
const passport = require("passport");
const { body, validationResult } = require("express-validator");


router.use(passport.authenticate('jwt', { session: false }))
/* GET users listing. */
router.get('/', async (req, res, next) =>{
  try {
    const users = await User.find().select('-password');
    if (!users) throw Error('No users exist');
    res.json(users);
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});
//Refresh Check
router.get("/me", async(req, res, next) => {
  res.json({success: true, user: req.user})
})

//UPDATE PROFILE PICTURE
router.put("/profile_picture", async(req, res,next) => {
  //TODO: FINISH THIS ROUTE TO UPDATE PROFILE PICTURE
})
//UPDATE USER BIO
router.put("/",
 body('bio', 'Bio must not be empty').trim().isLength({ min: 1 }).escape(),

 async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // There are errors. Render the form again with sanitized values/error messages.
    res.status(400).json({success: false, errors, msg: "input error"})
    return;
  }
  try {
    const response = await User.findByIdAndUpdate(req.user._id, {bio: req.body.bio}, {new: true}).select("-password")
    if(!response) throw Error("Something went wrong with updating bio")
    res.status(200).json({success: true, response})
  }
  catch (e) {
    res.status(400).json({msg: e.message})
  }
})

///GET ALL THE POSTS FROM A USER
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password")
    if(!user) throw Error("User does not exist")

    //CHECK IF YOU ARE ALLOWED TO SEE THIS PAGE I.E NOT A FRIEND OR THIS USER
    const index = user.friends.findIndex((id) => String(id) === String(req.user._id))
    const bool = String(req.user._id) === String(req.params.userId)
    if (index === -1 && !bool) throw Error("You are not allowed to see this users posts")


    const posts = await Post.find({creator: user._id}).populate({ 
      path: 'comments',
      populate: [{
       path: 'creator',
       select: 'first_name family_name _id'
      //  model: 'Component'
      }] 
   })
    res.status(200).json({success: true, user, posts})
  }
  catch (e) {
    res.status(400).json({msg: e.message})
  }
})

//Create a post
router.post("/posts", [
  body('body', 'Post must not be empty').trim().isLength({ min: 1 }).escape(),
  async (req, res, next) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.status(400).json({success: false, msg: "input error"})
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
// DELETE POST
router.delete("/posts/:postId", async (req, res, next) => {
  
  try {
    const post = await Post.findById(req.params.postId)
    if(!post) throw Error("Post not found")
    if (!post.creator.equals(req.user._id)) {
      return res.status(403).json({success: false, msg: "Can't delete someone else's post"})
    }
    const response = await post.delete()
    let result;
    if(response) {
      //DELETE POSTS COMMENTS
      result = await Comment.deleteMany({post: req.params.postId })
    }
    res.status(200).json({success:true, response, result,  msg: "Post deleted successfully"})
  }
  catch(e) {
    res.status(400).json({success: false, msg: e.message})
  }
})
//DELETE COMMENT
router.delete("/comments/:commentId", async (req, res) => {
  
  try {
    const comment = await Comment.findById(req.params.commentId)
    if(!comment) throw Error("Comment not found")
    const post = await Post.findById(comment.post)
    if(!post) throw Error("This comment is on a deleted Post")

    if(!comment.creator.equals(req.user._id)) {
      return res.status(403).json({success: false, msg: "Can't delete somoeno else's comment"})
    }
    const response = await comment.delete()
    let postToSave
    if(response) {
      //REMOVE COMMENT FROM THE POST
      post.comments = post.comments.filter(id => String(id) !== String(comment._id))
      postToSave = await post.save()
      if(!postToSave) throw Error("Something went wrong")
      //NEED TO TEST THIS OUT
    }
    res.status(200).json({success:true, response, postToSave,  msg: "Comment deleted successfully"})
  }
  catch(e) {
    res.status(400).json({success: false, msg: e.message})
  }
})

//COMMENT ON POST

router.post("/posts/:postId", [
  body('body', 'Comment must not be empty').trim().isLength({ min: 1 }).escape(),

  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.status(401).json({success: false, msg: "input error"})
      return;
    }
    const newComment = new Comment({
      body: req.body.body,
      creator: req.user._id,
      post: req.params.postId
    })
    try {
      const post = await Post.findById(req.params.postId)
      if(!post) throw Error("Post doesnt exist")

      
      const comment = await newComment.save()
      if (!comment) throw Error('Something went wrong creating a new comment');
      post.comments.push(comment._id)
      //SAVE COMMENT IN POST MODEL ARRAY
      const updatedPost = await post.save()
      if(!updatedPost) throw Error("Something went wrong with saving a comment in Post")

      let notify;
      if(!req.user._id.equals(post.creator)) {
          const newNotify = new Notification({
          sender: req.user._id,
          recipient: post.creator,
          post: post._id,
          type: "comment"
        })
        notify = await newNotify.save()
        if (!notify) throw Error("Something went wrong creating a notification")    
      }
      return res.status(200).json({success: true, comment,updatedPost, notify, msg: "comment created successfully"})
    }
    catch (e) {
      res.status(400).json({success: false,  msg: e.message });
    }
  }
])

//LIKE / UNLIKE POST
router.put("/posts/:postId", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId)
    if(!post) throw Error("Post not found")
    const index = post.likes.findIndex((id) => id === String(req.user._id))

    if (index === -1) {
      post.likes.push(String(req.user._id))
    }
    else {
      post.likes = post.likes.filter((id) => id !== String(req.user._id))
    }

    

    const updatedPost = await Post.findByIdAndUpdate(req.params.postId, post, {new: true} )
    if(!updatedPost) throw Error("Something went wrong")
    let notify;
    if(!req.user._id.equals(post.creator) && index === -1) {
        const newNotify = new Notification({
        sender: req.user._id,
        recipient: post.creator,
        post: post._id,
        type: "like"
      })
      notify = await newNotify.save()
      if(!notify) throw Error("Something went wrong with saving notification")
    }
    res.status(200).json({success: true, updatedPost, notify})
  }
  catch(e) {
    res.status(400).json({success:false, msg: e.message})
  }
  
})
//LIKE UNLIKE COMMENT
router.put("/comments/:commentId", async (req, res, next) => {
  
  try {
    const comment = await Comment.findById(req.params.commentId)

    if(!comment) throw Error("Comment not found")
    const index = comment.likes.findIndex((id) => id === String(req.user._id))

    if (index === -1) {
      comment.likes.push(String(req.user._id))
    }
    else {
      comment.likes = comment.likes.filter((id) => id !== String(req.user._id))
    }
    const updatedComment = await Comment.findByIdAndUpdate(req.params.commentId, comment, {new: true} )
    if(!updatedComment) throw Error("Something went wrong")

    if(!req.user._id.equals(comment.creator)) {
      const newNotify = new Notification({
      sender: req.user._id,
      recipient: comment.creator,
      comment: comment._id,
      type: "comment"
    })
    notify = await newNotify.save()
    if(!notify) throw Error("Something went wrong with saving notification")
  }
    res.status(200).json({success: true, updatedComment})
  }
  catch(e) {
    res.status(400).json({success:false, msg: e.message})
  }
  
})

//GET ALL THE POST INFO (USER, POST, COMMENT)
router.get("/posts/:postId", async (req, res, next) => {

  try {
    const post = await Post.findById(req.params.postId)
    .populate("creator", "_id first_name family_name")
    .populate("comments")
    if(!post) throw Error("Post doesn't exist")
    // const comments = await Comment.find({post: req.params.postId})
    res.status(200).json({success: true, post})
  }
  catch(e) {
    res.status(400).json({success:false, msg: e.message})
  }
})

module.exports = router;
