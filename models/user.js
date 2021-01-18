const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
      first_name: {type: String, required: true, maxlength: 100},
      family_name: {type: String, required: true, maxlength: 100},
      email: {type: String, required: true},
      password: {type: String, required:true}
    }
  );
  
  //Export model
  module.exports = mongoose.model('User', UserSchema);