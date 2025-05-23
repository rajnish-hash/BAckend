import {asyncHandler} from "../utils/Async.handler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.model.js";
import {uploadCloudinary} from "../utils/Clouinary.js";
import { ApiRespose } from "../utils/ApiResponse.js";



const registerUser=asyncHandler(async(req,res)=>{
    // get user details from frontend 
    //validation of details-not empty
    //check if user already exists : username or email
    // check for image ,check avtar
    // upload them to cloudinary ,avatar
    // create user object -- create entry in db
    //remove password and refresh token field  from response
    //check for user creation
    // return response

    // 1. get user details from frontend
    const {fullname,email,username,password}= req.body
    console.log("email : ",email)

    if([fullname,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError("All fields are required",400)
    }
    // check email contain @ or not



    if(!email.includes("@")){
        throw new ApiError("Email is not valid",400)
    }

    // 2. check if user already exists : username or email

    const existUser= User.findOne({
        $or:[{email},{username}]
    })

    if(existUser){
        throw new ApiError("User with email or username already exists",409)
    }

    // 3. check for image ,check avtar
   const avatarLocalPath= req.files?.avatar[0]?.path;

   if(!avatarLocalPath){
    throw new ApiError("Avatar is required",400)
   }
   
   // for coverImage
   const coverImageLocalPath= req.files?.coverImage[0]?.path;



    // 4. upload them to cloudinary ,avatar

    const avatar= await uploadCloudinary(avatarLocalPath)
    const coverImage= await uploadCloudinary(coverImageLocalPath)
    // console.log("avatar : ",avatar)

    if(!avatar ){
        throw new ApiError("Image upload failed",400)
    }

    // 5. create user object -- create entry in db
    const user= await User.create(
        {
            avatar:avatar.url,
            coverImage:coverImage?.url||"",
            email,
            password,
            username:username.tolowerCase(),
            fullname,

    })
    // 6. remove password and refresh token field  from response
    const createdUser =await user.findById(user._id).select(
        "-password -refreshToken"
    )
    // 7. check for user creation
    if(!createdUser){
        throw new ApiError("something went wrong while registering the User",500)
    }
    return res.status(201).json(
        new ApiRespose(200,createdUser,"User register successfully")
    )
})


export {registerUser}