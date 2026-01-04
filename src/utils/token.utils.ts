// Token Logic Here
import { env } from "../config/env";

import jwt, { SignOptions } from "jsonwebtoken";

export const generateAccessToken = (user: { id: number; email: string }) => {
    const payload = { id: user.id, email: user.email };
    const secret = env.ACCESS_TOKEN_SECRET as string;

    const options: SignOptions = {
        expiresIn: (env.ACCESS_TOKEN_EXPIRY || "1d") as any, // Cast to 'any' fixes the strict overload mismatch
    };

    return jwt.sign(payload, secret, options);
};