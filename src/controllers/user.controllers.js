import {asynchandler} from '../utils/asynchandler.js';
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import {uploadCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from "jsonwebtoken"

const genearteAccessAndRefreshToken = async (userId)=>{
  
  try{
    // console.log(userId);
    
  const user = await User.findById(userId);

  // console.log(user.generateRefreshToken());
  
  const accessToken =  user.generateAccessToken();
  // console.log(accessToken);
  const refreshToken =  user.generateRefreshToken();
  // console.log(refreshToken);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false })

  return {accessToken,refreshToken};

  }
  catch(error){
    throw new ApiError(500, error.message);
  }
  

}

const registerUser = asynchandler( async (req, res)=>{
  
  const {fullName,username, email, password} = req.body;
  // console.log("email: ",email);

  if(
    [fullName,username, email, password].some((field)=> field?.trim() === "")
  ){
    throw new ApiError(400,"All fieds are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email}]
  })

  if(existedUser){
    throw new ApiError(409, "User already exists with this username or email");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

  if(!avatarLocalPath){
    throw new ApiError(400," Avatar is required");
  }

  const avatar = await uploadCloudinary(avatarLocalPath);
  let coverImage;
  if(coverImageLocalPath){
     coverImage = await uploadCloudinary(coverImageLocalPath);
  }

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
    throw new ApiError(500," something went wrong while registering user");
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )

})

const loginUser = asynchandler( async (req,res)=>{

  const {email,username,password} = req.body;

  if(!email && !username){
    throw new ApiError(400,"Email or username is required");
  }

  const user = await User.findOne({
    $or: [{ email },{ username }]
  })

  if(!user){
    throw new ApiError(404,"User does not exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  // console.log(isPasswordValid);
  

  if(!isPasswordValid){
    throw new ApiError(404,"invalid user credentials");
  }

  const {accessToken,refreshToken} = await genearteAccessAndRefreshToken(user._id);

  const LoggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly:true,
    secure:true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {user: LoggedInUser,accessToken,refreshToken},
      "User logged in successfully"
    )
  )

})

const logoutUser = asynchandler ( async(req,res)=>{

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new:true
    }
  )

  const options={
    httpOnly:true,
    secure:true
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)  
  .clearCookie("refreshToken",options)  
  .json(201,{},"User logged Out succesfully")

})

const refreshAccessToken = asynchandler( async (req,res)=>{
  const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incommingRefreshToken){
    throw new ApiError(401,"Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
  
    const user = await User.findById(decodedToken?._id);
  
    if(!user){
      throw new ApiError(401,"invalid refresh token");
    }
  
    if(incommingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh token is expired or used");
    }
  
    const options={
      httpOnly:true,
      secure:true
    }
  
    const {accessToken,newRefreshToken} = await genearteAccessAndRefreshToken(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken,refreshToken:newRefreshToken},
        "acces Token renewed"
      )
    )
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid refresh token")
  }

})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
};