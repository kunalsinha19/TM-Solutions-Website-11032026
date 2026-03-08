import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
  sub: string;
  role: string;
  type: "access" | "refresh";
}

export function signToken(payload: JwtPayload, expiresIn: string | number) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
