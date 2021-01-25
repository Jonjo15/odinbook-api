const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
      first_name: {type: String, maxlength: 100},
      family_name: {type: String, maxlength: 100},
      email: {type: String, required: true},
      password: {type: String},
      facebookId: {type: String},
      bio: {type: String, maxlength: 300},
      profile_pic_url: {type: String},
      admin: { type: Boolean, default: false },
      friends: [{type: Schema.Types.ObjectId, ref: "User"}],
      friendRequests: [{type: Schema.Types.ObjectId, ref: "User"}]
    }
  );
  
  //Export model
  module.exports = mongoose.model('User', UserSchema);