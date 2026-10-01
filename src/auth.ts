import type { NextFunction, Request, Response } from "express";
import { TOKENS } from "./seed.js";
import type { Role, User } from "./types.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  const user = TOKENS[token];
  if (!user) return res.status(401).json({ error: "unauthorized" });
  req.user = user;
  next();
}

// TODO(task 4): enforce that req.user.role is one of `roles`.
export function requireRole(..._roles: Role[]) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
}
