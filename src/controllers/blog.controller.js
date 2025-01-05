
import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js";
import {Blog} from "../models/blog.model.js"
import mongoose,{isValidObjectId} from "mongoose";
import {User} from "../models/user.model.js";
import { isValidTrimmed } from "../utils/Validation.js";


const publishBlog = asyncHandler(async (req, res) => {
    const {title, content, hashtags} = req.body
    if (
        [title, content, hashtags].some((field) => field?.trim() === "")
    ) {
        throw new ApiError("400", "All fields are required to publish a blog");
    }

    const imageLocalPath = req.files?.blogImage?.[0]?.path;

    console.log("Blog image local path: ",imageLocalPath)

    if (!imageLocalPath) {
        throw new ApiError("400", "Blog image is required to publish a blog");
    }

    const blogImage = await uploadOnCloudinary(imageLocalPath)

    if (!blogImage) {
        throw new ApiError("400", "Blog image is required to publish a blog...");
    }

    const blog = await Blog.create({
        title,
        content,
        hashtags,
        blogImage: blogImage.url,
        blogAuthor: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(true, "Blog published successfully", blog

        ))

})




const deleteBlog = asyncHandler( async (req, res) => {
    const {blogId} = req.params

    if (!isValidObjectId(blogId)) {
        throw new ApiError("400", "Invalid blog id cannot delete");

    }

    const blogToBeDeleted = await Blog.findByIdAndDelete(blogId)

    if (!blogToBeDeleted) {
        throw new ApiError("404", "No Blog found to be deleted");
        
    }

    return res.status(200).json(
        new ApiResponse(200,{}, "Blog  is deleted successfully"
        ))

})


const updateBlogImage = asyncHandler( async (req, res) => {

    const blogId = req.params

    if (!isValidObjectId(blogId)) {
        throw new ApiError("400", "Invalid blog id cannot update");
        
    }

    const blogImageLocalPath = req.file?.path

    if (!blogImageLocalPath) {
        throw new ApiError("400", "Blog image file is missing");
    }

    const blog = await Blog.findById(blogId)

    if (!blog) {
        throw new ApiError("404", "No Blog found to be updated");
    }

    if (blog?.blogImage) {
        const publicId =  blog.blogImage.split('/').slice(-1)[0].split('.')[0];
        try {
                await deleteFromCloudinary(publicId)
        } catch (error) {
            throw new ApiError("500", "Could not delete the existing blog image");
        }
    }
    
    const blogImage = await uploadOnCloudinary(blogImageLocalPath)

    if (!blogImage.url) {
        throw new ApiError("400", "Error while uploading the blog image");
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
        blogId, 
        {
            $set:{
                blogImage: blogImage.url
            }
        },
           {
               new:true
            }
        
    )
    return res.status(200).json(
        new ApiResponse(200,  updatedBlog , "Blog image updated successfully")
    )
})

const updateBlog = asyncHandler(async (req, res) => {

    const {blogId} = req.params
    const {title, content, hashtags} = req.body

    if(!isValidObjectId(blogId)){
        throw new ApiError("400", "Invalid blog id cannot update the blog");
    }

    if (
       title && !isValidTrimmed(title) ||
       content && !isValidTrimmed(content) ||
       hashtags &&  (!Array.isArray(hashtags)  || !hashtags.every(isValidTrimmed))
    ) {
        throw new ApiError("400", "field must be provided for updating the blog  and they must not contain only whitespace");
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
        blogId,
        {
            $set:{
                title,
                content,
                hashtags
            }
        },{
            new: true
        }
    )

    if (!updatedBlog) {
        throw new ApiError("404", "No Blog found to be updated");
        
    }

    return res.status(200).json(
        new ApiResponse(200, updatedBlog, "Blog updated successfully")
    )


})



const getBlogById = asyncHandler(async (req, res) => {  
    const {blogId} = req.params

    if (!isValidObjectId(blogId)) {
        throw new ApiError("400", "Invalid blog id cannot get the blog");
    }

    const blog = await Blog.findById(blogId)

    if (!blog) {
        throw new ApiError("404", "No Blog found");
    }

    return res.status(200).json(
        new ApiResponse(200, blog, "Blog fetched successfully")
    )
})








export {
    publishBlog
}