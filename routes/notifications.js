var express = require('express');
var router = express.Router();
const passport = require("passport")
const User = require("../models/user")
const Notification = require("../models/notification")

router.use(passport.authenticate('jwt', { session: false }))

//GET ALL THE USERS NOTIFICATIONS (TODO: LIMIT 10)
router.get("/", async(req, res) => {
    try {
        const notifications = await Notification.find({recipient: req.user._id})
                                                .populate("commentId", "post _id")
                                                .populate("sender", "first_name family_name _id")
                                                .sort({"createdAt": -1})
                                                .limit(10)
                                              
        if(!notifications) throw Error("No notifications found")
        res.status(200).json({success: true, notifications})
    }
    catch(e) {
        res.status(400).json({success: false, msg: e.message})
    }
})
router.get("/all", async (req, res) => {
    try {
        const notifications = await Notification.find({recipient: req.user._id})
                                                .populate("commentId", "post _id")
                                                .populate("sender", "first_name family_name _id")
                                                .sort({"createdAt": -1})
                                                .limit(100)
        if(!notifications) throw Error("No notifications found")
        res.status(200).json({success: true, notifications})
    }
    catch(e) {
        res.status(400).json({success: false, msg: e.message})
    }
})
//MARK all users NOTIFICATIONS READ
router.put("/all", async (req, res) => {
    try {
        const response = await Notification.updateMany({recipient: req.user._id, seen: false}, {seen: true})
        if(!response) throw Error("Something went wrong with updating notifications")
        res.status(200).json({success: true, response})
    }
    catch(e){
        res.status(400).json({success: false, msg: e.message})
    }
})
router.put("/", async (req, res) => {
    try {
        const response = await Notification.updateMany({recipient: req.user._id, _id: {$in: req.body.notifications}}, {seen:true})
        if(!response) throw Error("Something went wrong with updating notifications")
        res.status(200).json({success: true, response})
    }
    catch(e) {
        res.status(400).json({success: false, msg: e.message})
    }
})
module.exports = router;