import express from "express";
import dotenv from 'dotenv';
import { startSendOtpConsumer } from "./consumer.js";

dotenv.config();

startSendOtpConsumer();

const app = express();

app.listen(process.env.PORT, ()=>{
    console.info(`Server is running on the port ${process.env.PORT}`);
})