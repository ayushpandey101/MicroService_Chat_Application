import mongoose, { Document, Schema } from "mongoose";
const schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    avatar: {
        url: String,
        publicId: String,
    },
}, {
    timestamps: true,
});
export const User = mongoose.model("User", schema);
//# sourceMappingURL=User.js.map