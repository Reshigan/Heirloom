"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = void 0;
const index_1 = require("../index");
/**
 * Audit logging middleware
 * Logs sensitive operations to audit_log table
 */
const auditLogger = async (req, res, next) => {
    const sensitiveRoutes = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/vault/upload',
        '/api/vault/items',
        '/api/trusted-contacts',
        '/api/check-in',
        '/api/subscriptions'
    ];
    const shouldLog = sensitiveRoutes.some(route => req.path.startsWith(route));
    if (shouldLog && req.method !== 'GET') {
        const originalSend = res.send;
        res.send = function (data) {
            res.send = originalSend;
            setImmediate(async () => {
                try {
                    await index_1.prisma.auditLog.create({
                        data: {
                            userId: req.user?.userId,
                            action: `${req.method} ${req.path}`,
                            details: {
                                body: req.body,
                                query: req.query,
                                params: req.params
                            },
                            ipAddress: req.ip || req.socket.remoteAddress,
                            userAgent: req.headers['user-agent']
                        }
                    });
                }
                catch (error) {
                    console.error('Audit log error:', error);
                }
            });
            return originalSend.call(this, data);
        };
    }
    next();
};
exports.auditLogger = auditLogger;
