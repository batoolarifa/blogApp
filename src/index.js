import connectDB from "./db/index.js";
import dotenv from "dotenv";
import {app} from "./app.js";


dotenv.config({
    path: "/.env"
})

connectDB()
.then(() => {
    app.on("error",(error) => {
        console.log("ERROR: " , error);
    })
    app.listen(process.env.PORT || 8000 ,() => {
        console.log(`Server is running on port ${process.env.PORT}`);

    })
})
.catch((error) => {
    console.log('MongoDB connection failed !!!',error);
})

