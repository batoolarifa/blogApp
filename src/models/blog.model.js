import mongoose,{ Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const blogSchema = new Schema({
    title:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true

    },
    content:{
        type: String,
        required: true,
        
    },
    hashtags:[
        {
        
        type: String,
        required: true,
        index:true,
        validate:{
            validator: function(tag) {
            return /^#[a-zA-Z0-9_]+$/.test(tag);
            
        },
        message:"Each hashtag must start with # and contain only alphanumeric characters or underscores."
        
        },
     },
   ],
   blogAuthor:{
    type: Schema.Types.ObjectId,
    ref: "User",
    
  },
  blogImage:{
    type: String,
    required: true,
    
  },
  views:{
    type: Number,
    default: 0
    
},
isPublished: {
    type: Boolean,
    default: true
  },
    
    
},{timestamps:true})

blogSchema.plugin(mongooseAggregatePaginate);
export const Blog = mongoose.model("Blog", blogSchema)