import {asynchandler} from '../utils/asynchandler.js';
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import {uploadCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from '../utils/apiResponse.js';

const registerUser = asynchandler( async (req, res)=>{
  
  const {fullName,username, email, password} = req.body;
  // console.log("email: ",email);

  if(
    [fullName,username, email, password].some((field)=> field?.trim === "")
  ){
    throw new ApiError(400,"All fiels are required");
  }

  const existedUser = User.findOne({
    $or:[{ username }, { email}]
  })

  if(existedUser){
    throw new ApiError(409, "User already exists with this username or email");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if(!avatarLocalPath){
    throw new ApiError(400," Avatar is required");
  }

  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);

  if(!avatar){
    throw new ApiError(500, "Avatar upload failed");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
    email
  })

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if(!createdUser){
    throw new ApiError(500," somthing went wrong while registering user");
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )

})

export {registerUser};