const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const CommentSchema = new Schema(
    {
      creator: {type: Schema.Types.ObjectId, ref: 'User', required: true},
      post: {type: Schema.Types.ObjectId, ref: 'Post', required: true},
      body: {type: String, required: true},
      likes: {type: [String], default: []},
      createdAt: { type: Date, default: new Date().toISOString() }
    }   
  );
  
  //Export model
  module.exports = mongoose.model('Comment', CommentSchema);