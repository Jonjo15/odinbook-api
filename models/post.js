const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const PostSchema = new Schema(
    {
      creator: {type: Schema.Types.ObjectId, ref: 'User', required: true},
      body: {type: String, required: true},
      likes: {type: [String], default: []},
      comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
      createdAt: { type: Date, default: new Date().toISOString() }
    }   
  );
  
  //Export model
  module.exports = mongoose.model('Post', PostSchema);