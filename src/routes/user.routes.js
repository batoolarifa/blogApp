import { Router } from "express";
import {  registerUser,
          loginUser,
          logoutUser, 
          refreshAccessToken, 
          changeCurrentPassword, 
          getCurrentUser, 
          updateAccountDetails,
          updateUserProfilePicture, 
          updateUserCoverImage, 
          getUserFollowerProfile , 
          getBlogHistory,
}

from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();
import { verifyJWT } from "../middlewares/auth.middleware.js";

router.route("/register").post(
    upload.fields([
        {
            name: "profilePicture",
            maxCount:1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/update-profile-pic").patch(verifyJWT,upload.single("profilePicture"),updateUserProfilePicture)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/f/:username?").get(verifyJWT,getUserFollowerProfile)
router.route("/blog-history").get(verifyJWT,getBlogHistory)



export default router