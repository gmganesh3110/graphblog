import {Schema,model} from "mongoose";
import { IBlog } from "./types/types";

const blogSchema=new Schema<IBlog>({
    title:{type:String,required:true},
    content:{type:String,required:true},
    date:{type:String,required:true},
    user:{type:Schema.Types.ObjectId,ref:"User"},
    comments:[{type:Schema.Types.ObjectId,ref:"Comment"}],
},{
    timestamps:true
})

export const BlogModel=model<IBlog>("Blog",blogSchema)