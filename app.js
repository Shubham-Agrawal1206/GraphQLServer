require('dotenv').config();
const express = require("express");
const app = express();
const { graphqlHTTP } = require("express-graphql");
const schema = require("./schema/schema");
const mongoose = require("mongoose");

app.use(
    "/graphql",
    graphqlHTTP({
        schema,
        graphiql: true,
    })
);

mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);

mongoose.Promise = global.Promise;

const databaseUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/graphql";
mongoose
    .connect(databaseUri)
    .then(() => console.log("Database connected"))
    .catch((err) => console.log(`Database connection error: ${err.message}`));

app.listen(4000, () => {
    console.log("App listening");
});
