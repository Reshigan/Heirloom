"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoUtils = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Encryption utilities for client-side encryption support
 * Note: Actual encryption happens client-side using Web Crypto API
 * These utilities are for server-side operations like password hashing
 */
class CryptoUtils {
    /**
     * Hash password using bcrypt
     */
    static async hashPassword(password) {
        const salt = await bcryptjs_1.default.genSalt(12);
        const hash = await bcryptjs_1.default.hash(password, salt);
        return { hash, salt };
    }
    /**
     * Verify password against hash
     */
    static async verifyPassword(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    }
    /**
     * Generate random token for verification, magic links, etc.
     */
    static generateToken(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    /**
     * Generate UUID v4
     */
    static generateUUID() {
        return crypto_1.default.randomUUID();
    }
    /**
     * Generate salt for client-side encryption
     */
    static generateSalt() {
        return crypto_1.default.randomBytes(16).toString('hex');
    }
    /**
     * Hash data using SHA-256 (for checksums, etc.)
     */
    static sha256(data) {
        return crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
}
exports.CryptoUtils = CryptoUtils;
