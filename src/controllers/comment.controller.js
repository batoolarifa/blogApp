import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js";
import mongoose,{isValidObjectId} from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Blog } from "../models/blog.model.js";


const addComment = asyncHandler(async (req, res) => {
   const {blogId} = req.params
   const {content} = req.body

   if (!isValidObjectId(blogId)) {
    throw new ApiError("400", "Invalid blog id cannot add a comment");
   }

   if (!content) {
       throw new ApiError("400", "Content is required to add a comment");
   }

   const blogExists = await Blog.findById(blogId)

   if (!blogExists) {
    throw new ApiError("404", " Blog does not exist cannot add a comment");
   }

   const comment = await Comment.create({
       blog: blogId,
       content,
       commentedBy: req.user._id
   })

   if (!comment) {
    throw new ApiError("400", "Something went wrong while creating a comment");
    
   }

   return res.status(200)
              .json( new ApiResponse(200, comment, "Comment added successfully"))
    
})



const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {content} = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError("400", "Invalid comment id cannot update the comment");
    }

    if (!content) {
        throw new ApiError("400", "Content is required to update a comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId, {
        $set: {
            content
        }
    }, {
        new: true
    })

    if (!updatedComment) {
        throw new ApiError("400", "Something went wrong while updating a comment");
    }

    return res.status(200)
                .json( new ApiResponse(200, updatedComment, "Comment updated successfully"))
    

})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if (!isValidObjectId(commentId)) {    
        throw new ApiError("400", "Invalid comment id cannot delete the comment");
    }

    const commentTobeDeleted = await Comment.findByIdAndDelete(commentId)

    if (!commentTobeDeleted) {
        throw new ApiError("404", "Comment does not exist or has already been deleted");
    }

   return res.status(200)
                .json( new ApiResponse(200, {}, "Comment deleted successfully"))
})


const getBlogComments = asyncHandler(async (req, res) => {
    const {blogId} = req.params
    if (!isValidObjectId(blogId)) {
        throw new ApiError("400", "Invalid blog id cannot get the comments");
    }

    console.log(blogId)

   const comments = await Comment.aggregate([
                                      
        { $match:{blog: new mongoose.Types.ObjectId(blogId)}},
        {$lookup: {from: "users", localField: "commentedBy", foreignField:"_id", as: "commentedByUser", 
            pipeline: [{$project:{fullName:1}}]
        }},{
            $addFields: 
            { commentedByUser: {$first: "$commentedByUser.fullName"}
        }
    },{
        $project: {
            content: 1,
            commentedByUser:1
        }
    }
    ])
    if (!comments) {
        throw new ApiError("400", "Something went wrong while getting the comments");
        
    }
    if (comments.length === 0) {
        throw new ApiError("404", "No comments found");
    }

    return res.status(200).json(
        new ApiResponse(200, comments, "All comments of the blog are fetched successfully")
    )

})



export{
    addComment,
    updateComment,
    deleteComment,
    getBlogComments
}