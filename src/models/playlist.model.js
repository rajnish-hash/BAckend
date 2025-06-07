import { Schema } from "mongoose";



const playlistSchema = new Schema(
    {
        title:{
            type:String,
            required:true,
            trim:true,
        },
        description:{
            type:String,
            required:true,
            trim:true,
        },
        video:[
            {
                type:Schema.Types.ObjectId, // video being added to the playlist
                ref:"Video",
                
            }
        ],
        owner:{
            type:Schema.Types.ObjectId, // user who created the playlist
            ref:"User",
            required:true,
        }
    },{timestamps:true})


export const Playlist = mongoose.model("Playlist", playlistSchema);