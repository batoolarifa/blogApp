import mongoose,{Schema} from "mongoose";

const commentSchema = new Schema({
    blog:{
        type: Schema.Types.ObjectId,
        ref: "Blog",
    },
    content:{
        type: String,
        required: true,
    },
    commentedBy:{
        type: Schema.Types.ObjectId,
        ref: "User",
    }
},{timestamps: true});

export const Comment = mongoose.model("Comment", commentSchema);