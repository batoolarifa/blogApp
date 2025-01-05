import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
   },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    fullName:{
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    coverImage:{
    type: String,
   
   },
   blogHistory:[
    {
        type: Schema.Types.ObjectId,
        ref: "Blog",
    }
   ],
   
   profilePicture:{
    type: String,
    required: true,
    
   },
   password:{
    type: String,
    required: true,
    validator:{
        validator: function(password) {
            return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
        },
        message: "Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character."
    }
   },
   refreshToken: {
    type: String
   },
   linkdenUrl:{
    type:String,
    
   },
   githubUrl:{
    type:String,
    
    },
   
   facebookUrl:{
    type:String,
   },
   tagline:{
    type: String,
    required: true,
   },
   about:{
    type: String,
    required: true,
    validate: {
        validator: function(value) {
            return value.trim().length >= 100 && value.trim().length <= 2000;
        },
        message: "About section must be between 100 and 2000 characters long."
    },
   }
   
},{
    timestamps: true
});

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();
    
    
    this.password = await bcrypt.hash(this.password, 10);
   
    next();
    
})

userSchema.methods.isPasswordCorrect = async function (password) {
    
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id:this._id,
            email: this.email,
            username: this.username,
            fullName:this.fullName

    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id:this._id,
           

    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
    

}

export const User = mongoose.model("User", userSchema);