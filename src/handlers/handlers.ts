import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLSchema,
  GraphQLString,
  GraphQLID,
} from "graphql";
import { BlogType, CommentType, UserType } from "../schema/schema";
import { UserModel } from "../models/User";
import { BlogModel } from "../models/Blog";
import { CommentModel } from "../models/Comments";
import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
const RootQuery = new GraphQLObjectType({
  name: "RootQuery",
  fields: () => ({
    users: {
      type: GraphQLNonNull(GraphQLList(UserType)),
      async resolve(parent, args, context) {
        return await UserModel.find();
      },
    },
    user: {
      type: UserType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
      },
      async resolve(parent, { id }, context) {
        return await UserModel.findById(id).populate("blogs");
      },
    },
    blogs: {
      type: GraphQLNonNull(GraphQLList(BlogType)),
      async resolve(parent, args, context) {
        return await BlogModel.find();
      },
    },
    blog: {
      type: BlogType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
      },
      async resolve(parent, { id }, context) {
        return await BlogModel.findById(id).populate("user comments");
      },
    },
    comments: {
      type: GraphQLNonNull(GraphQLList(CommentType)),
      async resolve(parent, args, context) {
        return await CommentModel.find();
      },
    },
  }),
});

const mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: () => ({
    signUp: {
      type: UserType,
      args: {
        name: { type: GraphQLNonNull(GraphQLString) },
        email: { type: GraphQLNonNull(GraphQLString) },
        password: { type: GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, args, context) {
        const { name, email, password } = args;
        const userExists = await UserModel.findOne({ email });
        if (userExists) {
          throw new Error("User already exists");
        }
        const hashedPassword = await bcryptjs.hashSync(password);
        const user = new UserModel({
          name,
          email,
          password: hashedPassword,
        });
        return await user.save();
      },
    },
    login: {
      type: UserType,
      args: {
        email: { type: GraphQLNonNull(GraphQLString) },
        password: { type: GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, { email, password }) {
        const user = await UserModel.findOne({ email });
        if (!user) {
          throw new Error("User does not exist");
        }
        const isPasswordValid = await bcryptjs.compareSync(
          password,
          user.password
        );
        if (!isPasswordValid) {
          throw new Error("Password is incorrect");
        }
        return user;
      },
    },

    addBlog: {
      type: BlogType,
      args: {
        title: { type: GraphQLNonNull(GraphQLString) },
        content: { type: GraphQLNonNull(GraphQLString) },
        date: { type: GraphQLNonNull(GraphQLString) },
        user: { type: GraphQLNonNull(GraphQLID) },
      },
      async resolve(parent, { title, content, date, user }) {
        const session = await mongoose.startSession();
        try {
          const blog = new BlogModel({
            title,
            content,
            date,
            user,
          });
          const existingUser = await UserModel.findById(user);
          if (!existingUser) {
            throw new Error("User does not exist");
          }
          await blog.save();
          await existingUser.updateOne({ $push: { blogs: blog } });
          await existingUser.save({ session });
          return await blog.save();
        } catch (error) {
          throw error;
        } finally {
          session.endSession();
        }
      },
    },

    updateBlog: {
      type: BlogType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
        title: { type: GraphQLNonNull(GraphQLString) },
        content: { type: GraphQLNonNull(GraphQLString) },
        date: { type: GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, { id, title, content, date }) {
        const blog = await BlogModel.findByIdAndUpdate(
          id,
          {
            title,
            content,
            date,
          },
          {
            new: true,
          }
        );
        if (!blog) {
          throw new Error("Blog not found");
        }
        return blog;
      },
    },
    deleteBlog: {
      type: BlogType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
      },
      async resolve(parent, { id }) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          // Optional: Validate ID format
          if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("Invalid blog ID format");
          }

          const blog = await BlogModel.findById(id).session(session);
          if (!blog) {
            throw new Error("Blog not found");
          }

          const existingUser = await UserModel.findById(blog.user).session(
            session
          );
          if (!existingUser) {
            throw new Error("No Users Linked to this blog");
          }

          // Remove blog reference from user
          await existingUser.updateOne(
            { $pull: { blogs: blog._id } },
            { session }
          );

          // Delete the blog
          await blog.deleteOne({ session });

          await session.commitTransaction();
          session.endSession();

          return blog;
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          console.error(error);
          throw error;
        }
      },
    },

    addCommentToBlog: {
      type: CommentType,
      args: {
        text: { type: GraphQLNonNull(GraphQLString) },
        date: { type: GraphQLNonNull(GraphQLString) },
        user: { type: GraphQLNonNull(GraphQLID) },
        blog: { type: GraphQLNonNull(GraphQLID) },
      },
      async resolve(parent, { text, date, user, blog }) {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();
          const comment = new CommentModel({
            text,
            date,
            user,
            blog,
          });
          const existingUser = await UserModel.findById(user);
          if (!existingUser) {
            throw new Error("User does not exist");
          }
          const existingBlog = await BlogModel.findById(blog);
          if (!existingBlog) {
            throw new Error("Blog does not exist");
          }
          await comment.save({ session });
          await existingUser.updateOne({ $push: { comments: comment } });
          await existingBlog.updateOne({ $push: { comments: comment } });
          await existingBlog.save({ session });
          await existingUser.save({ session });
          return comment;
        } catch (error) {
          throw error;
        } finally {
          session.commitTransaction();
        }
      },
    },
    deleteCommentFromBlog: {
      type: CommentType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
      },
      async resolve(parent, { id }) {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();

          const comment = await CommentModel.findById(id).populate("user");
          if (!comment) {
            throw new Error("Comment not found");
          }

          const existingUser = await UserModel.findById(comment.user);
          if (!existingUser) {
            throw new Error("No Users Linked");
          }
          await existingUser.updateOne({ $pull: { comments: comment._id } });
          await existingUser.save({ session });

          const existingBlog = await BlogModel.findById(comment.blog);
          if (!existingBlog) {
            throw new Error("No Blogs Linked");
          }
          await existingBlog.updateOne({ $pull: { comments: comment._id } });
          await existingBlog.save({ session });

          await comment.deleteOne({ session });

          await session.commitTransaction();
          return comment;
        } catch (error) {
          await session.abortTransaction();
          throw error;
        } finally {
          session.endSession();
        }
      },
    },
  }),
});

export default new GraphQLSchema({
  query: RootQuery,
  mutation,
});
