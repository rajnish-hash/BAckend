import { Schema } from "mongoose";


const likeSchema = new Schema(
    {
        video:{
            type:Schema.Types.ObjectId, // video being liked
            ref:"Video",
            required:true,
        },
        comment:{
            type:Schema.Types.ObjectId, // comment being liked
            ref:"Comment",
        },
        tweet:{
            type:Schema.Types.ObjectId, // tweet being liked
            ref:"Tweet",
        },
        likedby:{
            type:Schema.Types.ObjectId, // user who liked the video/comment/tweet
            ref:"User",
            required:true,
        },
    },{timestamps:true});

export const Like =  mongoose.model("Like", likeSchema);