import {connect} from "mongoose";

export const connectToDataBase  = async () => {
    try {
        await connect("mongodb+srv://Ganesh:root%40123@cluster0.pnuzrrg.mongodb.net/merngraphql");
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log(error);
    }
}
