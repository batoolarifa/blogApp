
import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js";
import {Blog} from "../models/blog.model.js"
import {isValidObjectId} from "mongoose";
import { isValidTrimmed } from "../utils/Validation.js";
import { title } from "process";


const publishBlog = asyncHandler(async (req, res) => {
    let  {title, content, hashtags} = req.body
    if (typeof hashtags === "string") {
        hashtags = hashtags.split("#").filter(tag => tag.trim() !== "").map(tag => `#${tag.trim()}`);
    }else{
        throw new ApiError("400", "Hashtags must be an array of strings");
    }
    if (
        [title, content].some((field => field?.trim() === "")  || hashtags.length === 0)
    ) {
        throw new ApiError("400", "All fields are required to publish a blog");
    }
    
    const imageLocalPath = req.file?.path;
    
    
    
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

    if (!blog) {
        if (blogImage) {
            const publicId = blogImage.url.split('/').slice(-1)[0].split('.')[0];
            await deleteFromCloudinary(publicId)
     }
     throw new ApiError("400", "Something went wrong while publishing the blog");
        
    }

    return res.status(201).json(
        new ApiResponse(201, "Blog published successfully", blog

        ))

})



const deleteBlog = asyncHandler( async (req, res) => {
    const {blogId} = req.params

    if (!isValidObjectId(blogId)) {
        throw new ApiError("400", "Invalid blog id cannot delete");

    }
    const blogToBeDeleted = await Blog.findByIdAndDelete(blogId)
    
    if (blogToBeDeleted ) {
        const publicId =  blogToBeDeleted.blogImage.split('/').slice(-1)[0].split('.')[0];
        try {
            await deleteFromCloudinary(publicId)
            } catch (error) {
                throw new ApiError("500", "Could not delete the existing blog image");
            }
        }

    if (!blogToBeDeleted) {
        throw new ApiError("404", "No Blog found to be deleted");
        
    }

    return res.status(200).json(
        new ApiResponse(200,{}, "Blog  is deleted successfully"
        ))

})


const updateBlogImage = asyncHandler( async (req, res) => {

    const {blogId} = req.params

    console.log(blogId)

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
    const {title, content} = req.body
    let {hashtags} = req.body
    

    if(!isValidObjectId(blogId)){
        throw new ApiError("400", "Invalid blog id cannot update the blog");
    }

    if (!title && !content && !hashtags) {
        throw new ApiError("400", "At least one field must be provided for updating the blog");
        
    }
    
    if (typeof hashtags === "string") {
        hashtags = hashtags
            .split("#") // Split by `#`
            .filter(tag => tag.trim() !== "") // Remove empty tags
            .map(tag => `#${tag.trim()}`); // Add `#` back
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



const togglePublishStatus = asyncHandler(async (req, res) => {
    const {blogId} = req.params

    if (!isValidObjectId(blogId)) {
        throw new ApiError("400", "Invalid blog id cannot toggle the publish status");
    }

    
    const blog = await Blog.findById(blogId)

    if (!blog) {
        throw new ApiError("404", " Blog does not exist  cannot toggle the publish status");
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
        blogId,
        {  
            $set: { 
                isPublished: !blog.isPublished
            }
        },
        {
            new: true
        }
    )

    if (!updateBlog) {
        throw new ApiError("404", "No Blog found cannot toggle the publish status");
        
    }

    return res.status(200).json(
        new ApiResponse(200, updatedBlog, "Blog publish status toggled successfully")
    )
})



const getAllBlogs = asyncHandler(async (req, res) => {
         const { page=1, limit= 4, search, sortBy = "title", sortType= "asc", hashtags, authorId } = req.query 
         const skip = parseInt((page - 1)) * parseInt(limit)

         const filter = {}

         if(search){
            filter.$or = [
                { title : { $regex: search, $options: "i" } },
                { content : { $regex: search, $options: "i" } },
                { hashtags : { $regex: search, $options: "i" } }
            ]
         }

         if (hashtags) {
            const hashtagsArr = hashtags.split(",").map(tag => decodeURIComponent(tag));
            filter.$or = hashtagsArr.map(tag => ({
                hashtags: {$regex: `${tag}`, $options: "i"}
            }))
            }


         
         if (authorId) {
            filter.blogAuthor = authorId
         }
         const sortOrder = sortType === "asc" ? 1 : -1;

         const blogs = await Blog.find(filter)
                           .sort({[sortBy]: sortOrder})
                           .skip(skip)
                           .limit(parseInt(limit))
                           .populate("blogAuthor", "fullname profilePicture")
         const totalBlogs = await Blog.countDocuments(filter)

         const pagination = {
            totalBlogs,
            page,
            limit,
            totalPages: Math.ceil(totalBlogs / limit)
         }

         if (!blogs) {
            throw new ApiError("404", "No Blogs found");
            
         }

         return res.status(200).json(
             new ApiResponse(200, {blogs, pagination}, "Blogs fetched successfully")
         )


})


export {
    publishBlog,
    deleteBlog,
    updateBlogImage,
    updateBlog,
    getBlogById,
    togglePublishStatus,
    getAllBlogs
}