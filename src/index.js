// require('dotenv').config({path: '../.env'})
import dotenv from 'dotenv';
import connectDB from './db/index.js';
import app from './app.js';



dotenv.config({
    path: '../.env'
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`App is listening on port ${process.env.PORT || 8000}`);
    })
})
.catch((error)=>{
    console.log("MONGO db connection failed !!!",error);
    throw err
})














/*
import express from 'express';
const app=express();

(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERROR",error);
            throw err
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is Listening on port ${process.env.PORT}`);
        })

    } catch(error){
        console.error("Error connecting to MongoDB:", error);
        throw err
    }

})()
*/