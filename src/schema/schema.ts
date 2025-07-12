import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { BlogModel } from "../models/Blog";
import { CommentModel } from "../models/Comments";
import { UserModel } from "../models/User";

export const UserType=new GraphQLObjectType({
    name:"User",
    fields:()=>({
        id:{type:GraphQLNonNull(GraphQLID)},
        name:{type:GraphQLNonNull(GraphQLString)},
        email:{type:GraphQLNonNull(GraphQLString)},
        password:{type:GraphQLNonNull(GraphQLString)},
        blogs:{
            type:GraphQLNonNull(GraphQLList(BlogType)),
            async resolve(parent){
                try {
                    const blogs=await BlogModel.find({user:parent.id})
                    return blogs
                } catch (error) {
                    throw error
                }
            }
        },
        comments:{
            type:GraphQLNonNull(GraphQLList(CommentType)),
            async resolve(parent){
                try {
                    const comments=await CommentModel.find({user:parent.id})
                    return comments
                } catch (error) {
                    throw error
                }
            }
        },
    })
})


export const BlogType=new GraphQLObjectType({
    name:"Blog",
    fields:()=>({
        id:{type:GraphQLNonNull(GraphQLID)},
        title:{type:GraphQLNonNull(GraphQLString)},
        content:{type:GraphQLNonNull(GraphQLString)},
        date:{type:GraphQLNonNull(GraphQLString)},
        user:{
            type:GraphQLNonNull(UserType),
            async resolve(parent){
                try {
                    const user=await UserModel.findById(parent.user)
                    return user
                } catch (error) {
                    throw error
                }
            },
        },
        comments:{
            type:GraphQLNonNull(GraphQLList(CommentType)),
            async resolve(parent){
                try {
                    const comments=await CommentModel.find({blog:parent.id})
                    return comments
                } catch (error) {
                    throw error
                }
            },
        },
    })
})


export const CommentType=new GraphQLObjectType({
    name:"Comment",
    fields:()=>({
        id:{type:GraphQLNonNull(GraphQLID)},
        text:{type:GraphQLNonNull(GraphQLString)},
        user:{type:GraphQLNonNull(UserType),
            async resolve(parent){
                try {
                    const user=await UserModel.findById(parent.user)
                    return user
                } catch (error) {
                    throw error
                }
            }
        },
        blog:{type:GraphQLNonNull(BlogType),
            async resolve(parent){
                try {
                    const blog=await BlogModel.findById(parent.blog)
                    return blog
                } catch (error) {
                    throw error
                }
            }
        },
    })
})