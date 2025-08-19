import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js"

dotenv.config({
    path : './.env'
})

connectDB()
.then(()=>{

    app.on("error",(err)=>{
        console.log("error occur at express ",err)
    })

    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is runnning at : ${process.env.PORT || 8000 }`);    
    })
})
.catch((err)=>{
    console.error("mongoDB connection failed",err)
})