import { asyncHandler } from "../utils/Async.handler.js";
import { ApiError, ApiSuccess } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/Clouinary.js";
import { ApiRespose } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefreshToken = async (userId) => {
  if (!userId) {
    throw new Error("Missing user ID");
  }

  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false }); // save the refresh token in database

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation failure:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and acess token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
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
  const { fullName, email, username, password } = req.body;
  // console.log("request.body: ",req.body)

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError("All fields are required", 400);
  }
  // check email contain @ or not

  if (!email.includes("@")) {
    throw new ApiError("Email is not valid", 400);
  }

  // 2. check if user already exists : username or email

  const existUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existUser) {
    throw new ApiError("User with email or username already exists", 409);
  }

  //    console.log("request.file",req.files)
  // 3. check for image ,check avtar
  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError("Avatar is required", 400);
  }

  // for coverImage
  //    const coverImageLocalPath= req.files?.coverImage[0]?.path;

  // 4. upload them to cloudinary ,avatar

  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);
  // console.log("avatar : ",avatar)

  if (!avatar) {
    throw new ApiError("Image upload failed", 400);
  }

  // 5. create user object -- create entry in db
  const user = await User.create({
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username ? username.toLowerCase() : "",
    fullName,
  });

  // 6. remove password and refresh token field  from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // 7. check for user creation
  if (!createdUser) {
    throw new ApiError("something went wrong while registering the User", 500);
  }
  return res
    .status(201)
    .json(new ApiRespose(200, createdUser, "User register successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req.body -> data
  // username or email
  // find the user
  // check password
  // generate access and refresh token
  // send cookie
  // send response

  // 1. req.body -> data
  const { username, email, password } = req.body;

  console.log("Login request body:", req.body);

  if (!username && !email) {
    throw new ApiError("Username or email is required", 400);
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError("User does not exist");
  }

  const isPasswordValid = await user.isPasswordMatched(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credential");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiSuccess(200, "User logged In successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken, // save user in its cookie
      })
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  if (req.user?._id) {
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { refreshToken: 1 },
    });
  }
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiRespose(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  console.log("Incoming Refresh Token:", incomingRefreshToken);

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("Decoded Token:", decodedToken);

    const user = await User.findById(decodedToken?._id);
    console.log("User found:", user);

    if (!user) {
      throw new ApiError(404, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid refresh token or expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiRespose(
          200,
          {
            accessToken,
            refreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while refreshing access token"
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordMatched(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiRespose(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiRespose(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  console.log("Update Account Details Request Body:", req.body);
  console.log("User from request:", req.user);

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized or user ID missing");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  console.log("Updated User:", user);
  return res
    .status(200)
    .json(new ApiRespose(200, user, "Account details updated successfully"));
});

// if file will update use another controller or endpoints

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalpath = req.file?.path;
  if (!avatarLocalpath) {
    throw new ApiError(400, "Avatar is missing");
  }

  console.log("Avatar Local Path:", avatarLocalpath);

  const avatar = await uploadCloudinary(avatarLocalpath);

  if (!avatar.url) {
    throw new ApiError(400, "Error on Avatar uploading ");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRespose(200, user, "avatar updated successfully"));
});

// delete an avatar

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is missing");
  }
  const coverImage = await uploadCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error on Cover image uploading");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRespose(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const existingUser = await User.findOne({ username: username.toLowerCase() });
  console.log("Found User:", existingUser);

const users = await User.find({}, "username");
console.log("All usernames:", users.map(u => u.username));


  console.log("Requested username:", username);

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $in: [
            req.user?._id,
            {
              $map: {
                input: "$subscribers",
                as: "sub",
                in: "$$sub.subscriber",
              },
            },
          ],
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiRespose(200, channel[0], "User channel fetched successfully")
    );
});


const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
     return res
    .status(200)
    .json(
        new ApiRespose(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  updateAccountDetails,
};

// note : if res is not used then write _ in place of res
