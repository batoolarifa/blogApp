import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

import { ApiResponse } from "../utils/ApiResponse.js";
import {validateEmail} from "../utils/Validation.js"
import jwt from "jsonwebtoken";



const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken =user.generateAccessToken()
        const refreshToken= user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, " Something went wrong while generating access and refresh tokens", error.message)
    }

}


const registerUser = asyncHandler(async (req, res) => {
    const {fullName, email, username, password, tagline, about, facebookUrl, githubUrl, linkdenUrl} = req.body
    

    if (
        [fullName, email, username , password, tagline, about].some((field) => field?.trim() === "")
    ) {
 
       throw new ApiError(400, "All fields are required")
     }

     if (!validateEmail(email)) {
        throw new ApiError(400, "Invalid email")
     }
    
    const existedUser = await User.findOne({
        $or: [
            {email},
            {username}
        ]
    })

    if (existedUser) {
        if (req.files?.profilePicture?.[0]?.path) {
            fs.unlinkSync(req.files?.profilePicture[0].path)
        }
        if (req.files?.coverImage?.[0]?.path) {
            fs.unlinkSync(req.files?.coverImage?.[0].path)
        }

        throw new ApiError(409, "User with email or username already exists")
    }

    const profilePictureLocalPath = req.files?.profilePicture?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    
    if (!profilePictureLocalPath) {
        throw new ApiError(400, "Profile picture is required")
        
    }

    const profilePicture = await uploadOnCloudinary(profilePictureLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    
    
    
    if (!profilePicture) {
        throw new ApiError(400, "Error uploading profile picture")
        
    }

    const user = await User.create({
        fullName,
        profilePicture: profilePicture.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
        tagline,
        about,
        facebookUrl: facebookUrl?.trim() || "",
        githubUrl: githubUrl?.trim() || "",
        linkdenUrl: linkdenUrl?.trim() || ""

    })


    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
}) 

const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body
    
    if (!email) {
        throw new ApiError(400, "Email is required")
    }

    const user = await User.findOne({email})
    console.log("Stored password in database:", user.password);


    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {     
        throw new ApiError(401, "Invalid password")
    }

    const {accessToken, refreshToken} =  await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
              .cookie("accessToken", accessToken, options)
              .cookie("refreshToken", refreshToken, options)
              .json(
                  new ApiResponse(200,{ user: loggedInUser , accessToken, refreshToken }, "User logged In Successfully")
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: {
                refreshToken: undefined
            }
        }, 
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
              .clearCookie("accessToken", options)
              .clearCookie("refreshToken", options)
              .json(new ApiResponse(200, {}, "User logged out successfully"))
    
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken  || req.body.refreshToken 
    
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used") 
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
                  .cookie("accessToken", accessToken, options)
                  .cookie("refreshToken", refreshToken, options)
                  .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully"))
        
    
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
})



const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword} = req.body

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "New password and confirm password do not match")
        
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid current password")
        
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async (req, res) => {
    
    return res.status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email, tagline, about, facebookUrl, githubUrl, linkdenUrl} = req.body
    const fieldsToUpdate = {}
    if (fullName) fieldsToUpdate.fullName = fullName
    if (email) fieldsToUpdate.email = email
    if (tagline) fieldsToUpdate.tagline = tagline
    if (about) fieldsToUpdate.about = about
    if (facebookUrl) fieldsToUpdate.facebookUrl = facebookUrl
    if (githubUrl) fieldsToUpdate.githubUrl = githubUrl
    if (linkdenUrl) fieldsToUpdate.linkdenUrl = linkdenUrl

    if (Object.keys(fieldsToUpdate).length === 0) {
        throw new ApiError(400, "Atleast one field must be provided")
        
    }

    const updatedUser = await User.findOneAndUpdate(
        {_id: req.user?._id},
        {$set: fieldsToUpdate},
        {new: true}
    ).select("-password -refreshToken")

    return res.status(200)
    .json(new ApiResponse(200, updatedUser, "Account details updated successfully"))



})


const updateUserProfilePicture = asyncHandler(async (req, res) => {
    const profilePictureLocalPath = req.file?.path;

    if (!profilePictureLocalPath) {
        throw new ApiError(400, "Profile picture is missing")
    }

    if(req.user?.profilePicture){
        const publicId = user.profilePicture.split('/').slice(-1)[0].split('.')[0];

        try {
            await deleteFromCloudinary(publicId)
            
        } catch (error) {
            throw new ApiError(500, "Could not delete the existing avatar from Cloudinary");

        }
    }

    const profilePicture = await uploadOnCloudinary(profilePictureLocalPath)

    if (!profilePicture.url) {
        throw new ApiError(400, "Error while uploading profile picture")

    }

    const uodatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                profilePicture: profilePicture.url
            }
        },
        {
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse(200 ,  updatedUser , "Profile picture updated  successfully"))
})


const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is missing")
    }

    if(req.user?.coverImage){
        const publicId = user.coverImage.split('/').slice(-1)[0].split('.')[0];

        try {
            await deleteFromCloudinary(publicId)
            
        } catch (error) {
            throw new ApiError(500, "Could not delete the existing cover image");

        }
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image")

    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse(200 ,  updatedUser , "Cover Image updated  successfully"))



})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserProfilePicture,
    updateUserCoverImage

    
}