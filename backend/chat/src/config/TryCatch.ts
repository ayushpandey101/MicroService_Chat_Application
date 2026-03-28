import type { NextFunction, Request, RequestHandler, Response } from "express"

const getErrorMessage = (error: unknown): string => {
    if (typeof error === "string") {
        return error;
    }

    if (error && typeof error === "object") {
        const err = error as {
            message?: unknown;
            error?: { message?: unknown };
        };

        if (typeof err.message === "string") {
            return err.message;
        }

        if (err.error && typeof err.error.message === "string") {
            return err.error.message;
        }
    }

    return "Internal Server Error";
};

const TryCatch = (handler: RequestHandler): RequestHandler =>{
    return async(req:Request, res: Response, next: NextFunction)=>{ 
        try {
            await handler(req, res,next)
        } catch (error: unknown) {
            console.error("Request handler error:", error);
            res.status(500).json({
                message: getErrorMessage(error)
            })
        }
    }
};


export default TryCatch;
