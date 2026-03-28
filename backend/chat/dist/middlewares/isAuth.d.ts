import type { NextFunction, Request, Response } from "express";
interface IUser extends Document {
    _id: String;
    name: String;
    email: String;
}
export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}
export declare const isAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export default isAuth;
//# sourceMappingURL=isAuth.d.ts.map