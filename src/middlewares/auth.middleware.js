import { asynchandler } from "../utils/asynchandler";
import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import jwt from "jsonwebtoken";

export const verifyJWT = asynchandler( async (req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","");
    
        if(!token){
            throw new ApiError(401,"Unathorized user");
        }
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user){
            throw new ApiError(400,"invalid Access token")
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid acces token ")
    }
})