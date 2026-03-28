import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/db.js';
import chatRoutes from './routes/chat.js';
import cors from 'cors';
import { app, io, server } from './config/socket.js';

dotenv.config();

connectDb();


app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());

app.use("/api/v1",chatRoutes);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled middleware error:", error);

    const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
            ? (error as { message: string }).message
            : "Internal Server Error";

    res.status(500).json({ message });
});

const port = process.env.PORT;

server.listen(port, () => {
    console.info(`Server is running on port ${port}`);
});

let isShuttingDown = false;

const shutdown = (signal: string, onComplete?: () => void) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.info(`Received ${signal}, shutting down chat service`);
    io.close(() => {
        server.close(() => {
            if (onComplete) {
                onComplete();
                return;
            }
            process.exit(0);
        });
    });

    setTimeout(() => {
        process.exit(0);
    }, 5000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGUSR2", () => {
    shutdown("SIGUSR2", () => {
        process.kill(process.pid, "SIGUSR2");
    });
});


