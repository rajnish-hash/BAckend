// require('dotenv').config({path: '../.env'})
import dotenv from 'dotenv';
import connectDB from './db/index.js';




dotenv.config({
    path: '../.env'
})
connectDB()














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