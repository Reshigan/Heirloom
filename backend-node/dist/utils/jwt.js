"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
class JWTUtils {
    /**
     * Generate JWT token
     */
    static sign(payload) {
        // @ts-ignore - JWT_EXPIRES_IN is a valid string for expiresIn
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }
    /**
     * Verify and decode JWT token
     */
    static verify(token) {
        try {
            return jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    /**
     * Decode JWT without verification (for debugging)
     */
    static decode(token) {
        return jsonwebtoken_1.default.decode(token);
    }
}
exports.JWTUtils = JWTUtils;
