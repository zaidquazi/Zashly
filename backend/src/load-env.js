// Load .env before any other code – import this first in server.js
import dotenv from "dotenv";
import path from "path";

// backend/.env then project root .env (root only fills in missing vars)
dotenv.config({ path: path.join(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
