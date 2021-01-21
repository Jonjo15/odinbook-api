var express = require('express');
var router = express.Router();
const passport = require("passport")
const User = require("../models/user")
router.use(passport.authenticate('jwt', { session: false }))

router.get("/", (req, res) => {
    res.json({user: req.user})
})
//SEND FRIEND REQUEST
router.post("/:userId", async(req, res, next) => {
    const friends = req.user.friends;
    
    try {
        //MAKE SURE TO NOT SEND FRIEND REQUEST TO YOURSELF
        if(req.user._id.equals(req.params.userId)) throw Error("Cant send friend request to yourself")
        //FIND RECIPIENT
        const recipientUser = await User.findById(req.params.userId)
        if(!recipientUser) throw Error("User doesnt exist")
        //CHECK IF FRIEND REQUEST ALREADY SENT
        const frIndex = recipientUser.friendRequests.findIndex((id) => String(id) === String(req.user._id))
        if (frIndex !== -1) {
            throw Error("Friend request already sent")
        }

        //CHECK IF ALREADY FRIENDS
        const index = friends.findIndex((id) => String(id) === String(recipientUser._id))
        if (index === -1) {
            recipientUser.friendRequests.push(req.user._id)
        }
        else {
            throw Error("You are already friends with this user")
        }
        //SAVE FRIEND REQUEST IN RECIPIENT USER
        const updatedRecipient = await User.findByIdAndUpdate(req.params.userId, recipientUser, {new: true} )
        if(!updatedRecipient) throw Error("Something went wrong with saving friend request")
        res.status(200).json({success: true, updatedRecipient})
    }
    catch(e) {
        res.status(400).json({success:false, msg: e.message})
    }
})

router.post("/:userId/accept", async (req,res) => {
    
    try {
        //FIND IF THERE IS A FRIEND REQUEST IN THE USERS F.R. ARRAy
        const index = req.user.friendRequests.findIndex((id) => String(id) === String(req.params.userId))
        if (index === -1 ) throw Error("Friend request doesnt exist")

        //CHECK IF ALREDY FRIENDS
        const frIndx = req.user.friends.findIndex((id) => String(id) === String(req.params.userId)) 
        if (frIndx !== -1) throw Error("Already friends with this user")
        // friendRequests = friendRequests.filter()

        req.user.friendRequests = req.user.friendRequests.filter((id) => String(id) !== String(req.params.userId))
        req.user.friends.push(req.params.userId)
        const updatedUser = await User.findByIdAndUpdate(req.user._id, req.user, {new: true})
        if(!updatedUser) throw Error("Something went wrong with saving the user")
        res.status(200).json({success: true, updatedUser})
    }
    catch(e) {
        res.status(400).json({success:false, msg: e.message})
    }
})
module.exports = router;