const getErrorMessage = (error) => {
    if (typeof error === "string") {
        return error;
    }
    if (error && typeof error === "object") {
        const err = error;
        if (typeof err.message === "string") {
            return err.message;
        }
        if (err.error && typeof err.error.message === "string") {
            return err.error.message;
        }
    }
    return "Internal Server Error";
};
const TryCatch = (handler) => {
    return async (req, res, next) => {
        try {
            await handler(req, res, next);
        }
        catch (error) {
            console.error("Request handler error:", error);
            res.status(500).json({
                message: getErrorMessage(error)
            });
        }
    };
};
export default TryCatch;
//# sourceMappingURL=TryCatch.js.map