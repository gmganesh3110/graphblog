import {Schema,model} from "mongoose";
import { IComment } from "./types/types";

const commentSchema=new Schema<IComment>({
    text:{type:String,required:true},
    date:{type:String,required:true},
    user:{type:Schema.Types.ObjectId,ref:"User"},
    blog:{type:Schema.Types.ObjectId,ref:"Blog"},
},{
    timestamps:true
})

export const CommentModel=model<IComment>("Comment",commentSchema)
