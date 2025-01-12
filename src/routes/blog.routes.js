import {Router} from "express";
import { 
    publishBlog, 
    deleteBlog , 
    updateBlogImage, 
    getBlogById, 
    updateBlog, 
    togglePublishStatus,
     getAllBlogs} 
    
from "../controllers/blog.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();


router.use(verifyJWT)

router.route("/publish").post( upload.single("blogImage"),publishBlog)
router.route("/:blogId")
                      .delete(deleteBlog)
                      .get(getBlogById)
router.route("/update-image/:blogId").patch(upload.single("blogImage"),updateBlogImage)
router.route("/:blogId").patch(updateBlog)

router.route("/").get(getAllBlogs)

router.route("/toggle/:blogId").patch(togglePublishStatus)

export default router