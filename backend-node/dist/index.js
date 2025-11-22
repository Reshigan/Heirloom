"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("./routes/auth"));
const vault_1 = __importDefault(require("./routes/vault"));
const recipients_1 = __importDefault(require("./routes/recipients"));
const trustedContacts_1 = __importDefault(require("./routes/trustedContacts"));
const checkIn_1 = __importDefault(require("./routes/checkIn"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const unlock_1 = __importDefault(require("./routes/unlock"));
const errorHandler_1 = require("./middleware/errorHandler");
const auditLogger_1 = require("./middleware/auditLogger");
const jobScheduler_1 = require("./services/jobScheduler");
dotenv_1.default.config();
BigInt.prototype.toJSON = function () {
    return this.toString();
};
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use(auditLogger_1.auditLogger);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', auth_1.default);
app.use('/api/vault', vault_1.default);
app.use('/api/recipients', recipients_1.default);
app.use('/api/trusted-contacts', trustedContacts_1.default);
app.use('/api/check-in', checkIn_1.default);
app.use('/api/subscriptions', subscriptions_1.default);
app.use('/api/unlock', unlock_1.default);
app.use(errorHandler_1.errorHandler);
let jobScheduler;
async function startServer() {
    try {
        jobScheduler = new jobScheduler_1.JobScheduler();
        await jobScheduler.start();
        app.listen(PORT, () => {
            console.log(`🚀 Constellation Vault API running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        console.log('⚠️  Continuing without job scheduler...');
        app.listen(PORT, () => {
            console.log(`🚀 Constellation Vault API running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
}
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    if (jobScheduler)
        await jobScheduler.stop();
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received, closing server...');
    if (jobScheduler)
        await jobScheduler.stop();
    await prisma.$disconnect();
    process.exit(0);
});
startServer();
