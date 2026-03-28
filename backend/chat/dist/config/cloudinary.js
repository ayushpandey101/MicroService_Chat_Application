import { v2 as cloudinaryV2 } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();
const getRequiredEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};
cloudinaryV2.config({
    cloud_name: getRequiredEnv("Cloud_Name"),
    api_key: getRequiredEnv("Api_Key"),
    api_secret: getRequiredEnv("Api_Secret"),
});
// Export shape expected by multer-storage-cloudinary (cloudinary.v2)
export default { v2: cloudinaryV2 };
//# sourceMappingURL=cloudinary.js.map