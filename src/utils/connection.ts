import {connect} from "mongoose";

export const connectToDataBase  = async () => {
    try {
        await connect(process.env.MONGO_URI as string);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log(error);
    }
}
