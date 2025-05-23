import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';



cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });


// Upload a file to Cloudinary
const uploadCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath){
            console.log("No file path provided");
            return null

        }
        // upload the file on cloudinary
        const reponse=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto",
        })

        // file has been upload successfully
        console.log("File uploaded successfully",reponse.url);
        return reponse
        
       
    }catch(error){
        fs.unlink(localFilePath,(err)=>{
            if(err){
                console.log("Error deleting file",err);
            }
        })

    }
}


export {uploadCloudinary}


