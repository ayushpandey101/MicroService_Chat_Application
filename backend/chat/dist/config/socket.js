import { Server, Socket } from 'socket.io';
import http from "http";
import express from 'express';
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
const userSocketMap = {};
export const getRecieverSocketId = (recieverId) => {
    return userSocketMap[recieverId];
};
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    if (userId) {
        socket.join(userId);
    }
    socket.on("typing", (data) => {
        socket.to(data.chatId).emit("userTyping", {
            chatId: data.chatId,
            userId: data.userId
        });
    });
    socket.on("stopTyping", (data) => {
        socket.to(data.chatId).emit("userStoppedTyping", {
            chatId: data.chatId,
            userId: data.userId
        });
    });
    socket.on("joinChat", (chatId) => {
        socket.join(chatId);
    });
    socket.on("leaveChat", (chatId) => {
        socket.leave(chatId);
    });
    socket.on("disconnect", () => {
        if (userId) {
            delete userSocketMap[userId];
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }
    });
    socket.on("connect_error", (error) => {
        console.error("Socket connection Error", error);
    });
});
export { app, server, io };
//# sourceMappingURL=socket.js.map