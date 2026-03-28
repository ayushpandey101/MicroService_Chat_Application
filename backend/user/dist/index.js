import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/db.js';
import { createClient } from 'redis';
import userRoutes from './routes/user.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import cors from 'cors';
dotenv.config();
connectDb();
connectRabbitMQ();
export const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redisClient.connect().catch(console.error);
const app = express();
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use("/api/v1", userRoutes);
const port = process.env.PORT;
const server = app.listen(port, () => {
    console.info(`Server is running on port ${port}`);
});
const shutdown = (signal) => {
    console.info(`Received ${signal}, shutting down user service`);
    server.close(() => {
        redisClient.quit().finally(() => process.exit(0));
    });
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
//# sourceMappingURL=index.js.map