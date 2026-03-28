import { v2 as cloudinaryV2 } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const cloudName = process.env.Cloud_Name;
const apiKey = process.env.Api_Key;
const apiSecret = process.env.Api_Secret;

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
    const resolvedCloudName = cloudName as string;
    const resolvedApiKey = apiKey as string;
    const resolvedApiSecret = apiSecret as string;

    cloudinaryV2.config({
        cloud_name: resolvedCloudName,
        api_key: resolvedApiKey,
        api_secret: resolvedApiSecret,
    });
}

export default { v2: cloudinaryV2 };
