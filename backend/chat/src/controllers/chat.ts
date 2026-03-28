import type { NextFunction, Response } from "express";
import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from "../models/Chat.js";
import { Messages } from "../models/Messages.js";
import axios from "axios";
import { getRecieverSocketId, io } from "../config/socket.js";

type UploadedImageFile = Express.Multer.File & {
    path?: string;
    filename?: string;
    secure_url?: string;
    public_id?: string;
    url?: string;
};

export const createNewChat = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { otherUserId } = req.body;

    if (!userId) {
        res.status(401).json({
            message: "Please Login",
        });
        return;
    }

    if (!otherUserId) {
        res.status(400).json({
            message: "Other userId is required",
        });
        return;
    }

    const currentUserId = String(userId).trim();
    const targetUserId = String(otherUserId).trim();

    if (!targetUserId) {
        res.status(400).json({
            message: "Other userId is required",
        });
        return;
    }

    if (currentUserId === targetUserId) {
        res.status(400).json({
            message: "You cannot create chat with yourself",
        });
        return;
    }

    const existingChat = await Chat.findOne({
        $or: [
            { users: [currentUserId, targetUserId] },
            { users: [targetUserId, currentUserId] },
        ],
    });

    if (existingChat) {
        res.json({
            message: "Chat already exists",
            chatId: existingChat._id,
        });
        return;
    }

    const newChat = await Chat.create({
        users: [currentUserId, targetUserId],
    });

    res.status(201).json({
        message: "New Chat Created",
        chatId: newChat._id,
    });

});


export const getAllChats = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;

    if (!userId) {
        res.status(400).json({
            message: "UserId missing",
        });
        return;
    }

    const currentUserId = String(userId);

    const chats = await Chat.find({ users: currentUserId }).sort({ updatedAt: -1 });

    const chatWithUserData = await Promise.all(
        chats.map(async (chat) => {
            const otherUserId = chat.users.find(id => id !== currentUserId);

            const unseenCount = await Messages.countDocuments({
                chatId: chat._id,
                sender: { $ne: currentUserId },
                seen: false,
            });

            try {
                const { data } = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);

                return {
                    user: data,
                    chat: {
                        ...chat.toObject(),
                        latestMessage: chat.latestMessage || null,
                        unseenCount,
                    },
                }
            } catch (error) {
                console.error("Failed to fetch user from user service", error);
                return {
                    user: { _id: otherUserId, name: "Unknown User", avatar: null },
                    chat: {
                        ...chat.toObject(),
                        latestMessage: chat.latestMessage || null,
                        unseenCount,
                    },
                };
            }
        })
    );

    res.json({
        chats: chatWithUserData,
    });
});


export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
    const senderId = req.user?._id;
    const { chatId, text } = req.body;
    const imageFile = req.file as UploadedImageFile | undefined;
    const trimmedText = typeof text === "string" ? text.trim() : "";


    if (!senderId) {
        res.status(401).json({
            message: "unauthorized",
        });
        return;
    }

    if (!chatId) {
        res.status(400).json({
            message: "ChatId Required",
        });
        return;
    }

    if (!trimmedText && !imageFile) {
        res.status(400).json({
            message: "Either text or image is required",
        });
        return;
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        res.status(404).json({
            message: "Chat not found",
        });
        return;
    }

    const isUserInChat = chat.users.some(
        (userId) => userId.toString() === senderId.toString()
    );

    if (!isUserInChat) {
        res.status(403).json({
            message: "You are not a participants of this chat",
        });
        return;
    }

    const otherUserId = chat.users.find(
        (userId) => userId.toString() !== senderId.toString()
    );
    if (!otherUserId) {
        res.status(401).json({
            message: "No other user",
        });
        return;
    }


    //socket setup
    const receiverSocketId = getRecieverSocketId(otherUserId.toString());
    let isReceiverInChatRoom = false;
    if (receiverSocketId) {
        const receiverSocket = io.sockets.sockets.get(receiverSocketId);
        if (receiverSocket && receiverSocket.rooms.has(chatId) ){
            isReceiverInChatRoom = true;
        }
    }


    let messageData: {
        chatId: string;
        sender: string;
        seen: boolean;
        seenAt?: Date;
        text?: string;
        messageType?: "text" | "image";
        image?: {
            url: string;
            publicId: string;
        };
    } = {
        chatId: chatId,
        sender: senderId.toString(),
        seen: isReceiverInChatRoom,
    };

    if (isReceiverInChatRoom) {
        messageData.seenAt = new Date();
    }

    if (imageFile) {
        const uploadedImageUrl =
            imageFile.path || imageFile.secure_url || imageFile.url;
        const uploadedImagePublicId =
            imageFile.filename || imageFile.public_id || "";

        if (!uploadedImageUrl) {
            res.status(500).json({
                message: "Image upload failed: URL not returned by storage",
            });
            return;
        }

        messageData.image = {
            url: uploadedImageUrl,
            publicId: uploadedImagePublicId,
        };
        messageData.messageType = "image";
        messageData.text = trimmedText;
    } else {
        messageData.text = trimmedText;
        messageData.messageType = "text";
    }


    const message = new Messages(messageData);

    const savedMessage = await message.save();

    const latestMessageText = imageFile ? "📷 Image" : trimmedText;

    await Chat.findByIdAndUpdate(chatId, {
        latestMessage: {
            text: latestMessageText,
            sender: senderId,
        },
        updatedAt: new Date(),
    }, { new: true }
    );

    //emit to sockets
    io.to(chatId).emit("newMessage", savedMessage)

    if(receiverSocketId){
        io.to(receiverSocketId).emit("newMessage", savedMessage)
    }

    const senderSocketId = getRecieverSocketId(senderId.toString());
    if (senderSocketId) {
        const senderSocket = io.sockets.sockets.get(senderSocketId);
        if (senderSocket) {
            senderSocket.emit("newMessage", savedMessage);
        }
    }

    if(isReceiverInChatRoom && senderSocketId){
        io.to(senderSocketId).emit("messagesSeen",{
            chatId: chatId,
            seenBy: otherUserId,
            messageIds: [savedMessage._id],
        })    
    }

    res.status(201).json({
        message: savedMessage,
        sender: senderId,
    });

});

export const deleteMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { messageId } = req.params;

    if (!userId) {
        res.status(401).json({
            message: "unauthorized",
        });
        return;
    }

    const message = await Messages.findById(messageId);

    if (!message) {
        res.status(404).json({
            message: "Message not found",
        });
        return;
    }

    if (message.sender !== userId.toString()) {
        res.status(403).json({
            message: "You can only delete your own message",
        });
        return;
    }

    const chat = await Chat.findById(message.chatId);

    if (!chat) {
        res.status(404).json({
            message: "Chat not found",
        });
        return;
    }

    const isMember = chat.users.some((u) => u.toString() === userId.toString());
    if (!isMember) {
        res.status(403).json({
            message: "You are not a participant of this chat",
        });
        return;
    }

    await Messages.findByIdAndDelete(messageId);

    const latestMessage = await Messages.findOne({ chatId: chat._id }).sort({ createdAt: -1 });

    await Chat.findByIdAndUpdate(chat._id, {
        latestMessage: latestMessage
            ? {
                  text: latestMessage.messageType === "image" ? "📷 Image" : latestMessage.text || "",
                  sender: latestMessage.sender,
              }
            : {
                  text: "",
                  sender: "",
              },
        updatedAt: new Date(),
    });

    io.to(message.chatId.toString()).emit("messageDeleted", {
        messageId,
        chatId: message.chatId,
    });

    res.json({
        message: "Message deleted",
        messageId,
    });
});

export const deleteChat = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const chatId = String(req.params.chatId || "");

    if (!chatId) {
        res.status(400).json({
            message: "ChatId Required",
        });
        return;
    }

    if (!userId) {
        res.status(401).json({
            message: "unauthorized",
        });
        return;
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        res.status(404).json({
            message: "Chat not found",
        });
        return;
    }

    const isMember = chat.users.some((u) => u.toString() === userId.toString());
    if (!isMember) {
        res.status(403).json({
            message: "You are not a participant of this chat",
        });
        return;
    }

    await Messages.deleteMany({ chatId: chat._id });
    await Chat.findByIdAndDelete(chat._id);

    io.to(chatId).emit("chatDeleted", { chatId });

    res.json({
        message: "Chat deleted",
        chatId,
    });
});


export const getMessagesByChat = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { chatId } = req.params;

    if (!userId) {
        res.status(401).json({
            message: "unauthorized",
        });
        return;
    }

    if (!chatId) {
        res.status(400).json({
            message: "ChatId Required",
        });
        return;
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        res.status(404).json({
            message: "Chat Not Found!",
        });
        return;
    }


    const isUserInChat = chat.users.some(
        (u) => u.toString() === userId.toString()
    );

    if (!isUserInChat) {
        res.status(403).json({
            message: "You are not a participants of this chat",
        });
        return;
    }

    const userIdStr = userId.toString();

    const  messagesToMarkSeen = await Messages.find({
        chatId: chatId,
        sender: {$ne: userIdStr},
        seen: false,
    });

    await Messages.updateMany({
        chatId: chatId,
        sender: {$ne: userIdStr},
        seen: false,
    },{
        seen: true,
        seenAt: new Date(),
    });

    const messages = await Messages.find({chatId}).sort({createdAt: 1});


    const otherUserId = chat.users.find((id) => id.toString() !== userId.toString());

    if (!otherUserId) {
        res.status(400).json({
            message: "No other User",
        });
        return;
    }

    try {
        const { data } = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);



    //socket work
        if(messagesToMarkSeen.length > 0){
            const otherUserSocketId = getRecieverSocketId(otherUserId.toString());
            if(otherUserSocketId){
                io.to(otherUserSocketId).emit("messagesSeen",{
                    chatId: chatId,
                    seenBy: userIdStr,
                    messageIds: messagesToMarkSeen.map((message) => message._id),
                });
            }
        }


    res.json({
        messages,
        user: data,
    });
    } catch (error) {
        console.error("Failed to fetch other user profile", error);
        res.json({
            messages,
            user: {_id: otherUserId, name:"Unknown User", avatar: null}
        })
    }
});