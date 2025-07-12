import { Schema, model } from "mongoose";
import { IUser } from "./types/types";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minLength: 6 },
    blogs: [{ type: Schema.Types.ObjectId, ref: "Blog" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  },
  {
    timestamps: true,
  }
);

export const UserModel = model<IUser>("User", userSchema);
