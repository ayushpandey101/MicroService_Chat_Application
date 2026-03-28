import Express from "express";
import { createNewChat, deleteChat, deleteMessage, getAllChats, getMessagesByChat, sendMessage } from "../controllers/chat.js";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
const router = Express.Router();
router.post("/chats/new", isAuth, createNewChat);
router.get("/chats/all", isAuth, getAllChats);
router.delete("/chats/:chatId", isAuth, deleteChat);
router.post("/message", isAuth, upload.single('image'), sendMessage);
router.get("/message/:chatId", isAuth, getMessagesByChat);
router.delete("/message/:messageId", isAuth, deleteMessage);
export default router;
//# sourceMappingURL=chat.js.map