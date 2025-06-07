import { Schema } from "mongoose";


const tweetschema=new Schema(
    {
        owner:{
            type:Schema.Types.ObjectId, // user who posted the tweet
            ref:"User",
            required:true
        },
        content:{
            type:String,
            required:true,
            trim:true,
        },

    },{timestamps:true}
)

export const Tweet =  mongoose.model("Tweet", tweetschema);