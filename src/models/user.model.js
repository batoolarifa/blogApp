import mongoose,{Schema} from "mongoose";

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
   Tagline:{
    type: String,
    required: true,
   },
   About:{
    type: String,
    required: true,
    minlength: 100,
    maxlength: 2000,
    validate: {
        validator: function(value) {
            return value.trim().length >= 100 && value.trim().length <= 2000;
        },
        message: "About section must be between 100 and 2000 characters long."
    },
   }
   
},{timestamps: true});


export const User = mongoose.model("User", userSchema);