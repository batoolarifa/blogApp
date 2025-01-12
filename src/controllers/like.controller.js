import { asyncHandler } from "../utils/asyncHandler.js"
import {Like} from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose,{isValidObjectId} from "mongoose"


const toggleCommentLike = asyncHandler(async (req, res) => {
   const {commentId} = req.params
   

   if (!isValidObjectId(commentId)) {
      throw new ApiError("400", "Invalid comment id cannot like the comment");
   }
   
   const likeComment = await Like.findOne({ comment: commentId, likedBy: req.user._id })

   if (likeComment) {
      const existingLikeComment = await Like.deleteOne({ _id: new mongoose.Types.ObjectId(likeComment._id)})
      if (!existingLikeComment.deletedCount ) {
         return res.status(200).json(new ApiResponse(200, {}, "Comment already unliked"));

      }

    return res.status(200)
    .json(new ApiResponse(200, {}, "Comment unliked successfully"))
       
    
   }
   else{
      const newLikeComment = await Like.create({
          likedBy: req.user._id,
          comment: commentId,
      });

      if (!newLikeComment) {
       throw new ApiError("500", "Something went wrong while liking the comment");
      }

      return res.status(200)
      .json(new ApiResponse(200, {}, "Comment liked successfully"))
   
   }


   
})



const getLikedBlogs = asyncHandler(async (req, res) => {   
   const likedBlog = await Like.aggregate([
        {$match: { likedBy: req.user._id}},
        {$lookup : { from:"blogs", localField: "blog", foreignField:"_id", as: "likedBlogDetails"  }},
        {$unwind: "$likedBlogDetails"},
        {$project: {"likedBlogDetails.title": 1, "likedBlogDetails.blogImage": 1}}
  ])
   if (!likedBlog) {
    throw new ApiError("404", "No liked blog found")
    
  }

  if (likedBlog.length === 0) {
    throw new ApiError("404", "No liked blog found")
  }

   return res.status(200)
      .json(new ApiResponse(200, likedBlog, " Users liked blogs fetched successfully"))
 })



const toggleBlogLike = asyncHandler(async (req, res) => {
     const {blogId} = req.params
     

     if (!isValidObjectId(blogId)) {
        throw new ApiError("400", "Invalid blog id cannot like the blog");
     }
     
     const likeBlog = await Like.findOne({ blog: blogId, likedBy: req.user._id })

     if (likeBlog) {
        const existingLike = await Like.deleteOne({ _id: new mongoose.Types.ObjectId(likeBlog._id)})
        if (!existingLike.deletedCount) {
         return res.status(200).json(new ApiResponse(200, {}, "Blog already unliked"));

      }

      return res.status(200)
      .json(new ApiResponse(200, {}, "Blog unliked successfully"))
         
      
     }
     else{
        const newLike = await Like.create({
            likedBy: req.user._id,
            blog: blogId,
        });

        if (!newLike) {
         throw new ApiError("500", "Something went wrong while liking the blog");
        }
        return res.status(200)
       .json(new ApiResponse(200, {}, "Blog liked successfully"))
     
     }


     
})


export {
    toggleCommentLike,
    toggleBlogLike,
    getLikedBlogs
}