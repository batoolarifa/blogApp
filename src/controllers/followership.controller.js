import { Followership } from "../models/followership.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";

const getFollowers = asyncHandler(async (req, res) => {

    const {userId} = req.params

    console.log(userId)
    
    if (!isValidObjectId(userId)) {
        throw new ApiError("400", "Invalid user id cannot get the followers");
    }

    const userExists = await User.findById(userId)

    if (!userExists) {
        throw new ApiError("404", "User does not exist");
    }

    const followers = await Followership.find({following: userId}).populate("followers","fullname profilePicture" )
    
  if (followers.length === 0) {
    throw new ApiError("404", "No followers found");
    
  }

    if (!followers) {
        throw new ApiError("400", "Something went wrong while getting the followers");
    }

    return res.status(200).json(
        new ApiResponse(200, followers, "Followers fetched successfully")
    )
})

const getFollowing = asyncHandler(async (req, res) => {

    const {userId} = req.params 

    if (!isValidObjectId(userId)) {
        throw new ApiError("400", "Invalid user id cannot get the following");
    }

    const userExists = await User.findById(userId)

    if (!userExists) {
        throw new ApiError("404", "User does not exist");
    }

    const following = await Followership.find({followers: userId}).populate("following","fullname profilePicture" )

    if (!following) {
        throw new ApiError("404", "No following found");
    }

    if (following.length === 0) {
        throw new ApiError("404", "No following found");
        
    }

    return res.status(200).json(
        new ApiResponse(200, following, "Following fetched successfully")
    )
})

const toggleFollowership = asyncHandler(async (req, res) => {
    const {userIdToFollow} = req.params 
    const currentUserId = req.user._id



    if (!isValidObjectId(userIdToFollow)) {
        throw new ApiError("404", "Invalid user id ");
    }

    if (currentUserId.toString() === userIdToFollow.toString()) {
        throw new ApiError("400", "You cannot follow yourself");
    }

    const existingFollowership = await Followership.findOne({
       followers: currentUserId,
       following: userIdToFollow
    })

    if (existingFollowership) {
        await Followership.deleteOne({_id: existingFollowership._id})
        return res.status(200).json(
            new ApiResponse(200, {}, "Unfollowed successfully")
        )
    }

    else {
        const newFollowership = await Followership.create({
            followers: currentUserId,
            following: userIdToFollow
        })

        if (!newFollowership) {
            throw new ApiError("400", "Something went wrong while following");
        }

        return res.status(200).json(
            new ApiResponse(200, {}, "Followed successfully"))
    }

})

export {
    getFollowers,
    toggleFollowership,
    getFollowing
}

// followers: The user ID of the person who is following another user. 
 // Follower: This is the person who is following someone else. 

// following: The user ID of the person being followed. Following: This is the person who is being followed.

