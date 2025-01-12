import mongoose,{Schema} from "mongoose";


const followershipSchema = new Schema({
    followers:{
        type:Schema.Types.ObjectId,
        ref: "User",
    },
    following:{
        type:Schema.Types.ObjectId,
        ref: "User",
    }
},{timestamps: true});


export const Followership = mongoose.model("Followership", followershipSchema);