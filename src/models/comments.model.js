import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Video } from "./video.model";


const commentSchema = new Schema(
    {
        content:{
            type:String,
            required:true,
            trim:true,
        },
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video",
            required:true,  
        },
        owner:{
            type:Schema.Types.ObjectId, // user who posted the comment
            ref:"User",
            required:true,
        },


},{timestamps:true})


commentSchema.plugin(mongooseAggregatePaginate);
export const Comment = mongoose.model("Comment", commentSchema);