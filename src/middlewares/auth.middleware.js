import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/Async.handler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
   console.log("Token from request:", token);
  if (!token) {
    // No token provided 
    if (req.path === "/logout" || req.originalUrl.endsWith("/logout")) {
      return next(); // allow logout to proceed
    }
    throw new ApiError(401, "Unauthorized", "No token provided");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    // Token malformed or expired
    if (req.path === "/logout" || req.originalUrl.endsWith("/logout")) {
      return next(); // allow logout to proceed even with invalid token
    }
    throw new ApiError(401, "Unauthorized", "Invalid or malformed token");
  }

  const user = await User.findById(decodedToken?._id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(401, "Unauthorized", "User not found");
  }

  req.user = user;
  next();
});
