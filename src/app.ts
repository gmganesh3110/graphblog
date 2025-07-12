import express from "express";
import { graphqlHTTP } from "express-graphql";
import { connectToDataBase } from "./utils/connection";
import dotenv from "dotenv";
import cors from "cors";
import schema from "./handlers/handlers";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 4000;

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    graphiql: true,
  })
);

connectToDataBase()
  .then(() => {
    app.listen(PORT, async () => {
      try {
        console.log(`Server is running on port ${PORT}`);
      } catch (error) {
        console.log(error);
      }
    });
  })
  .catch((err) => {
    console.log(err);
  });
