import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { logger } from '../utils/logger';

export interface WebSocketMessage {
  type: string;
  data: any;
  userId?: string;
  familyId?: string;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);

      logger.info(`WebSocket client connected: ${clientId}`);

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString()) as WebSocketMessage;
          this.handleMessage(clientId, data);
        } catch (error) {
          logger.error('Invalid WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Invalid message format' }
          }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(clientId);
      });

      ws.on('error', (error) => {
        logger.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnection(clientId);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        data: { clientId, message: 'Connected to Loominary WebSocket' }
      }));
    });
  }

  private handleMessage(clientId: string, message: WebSocketMessage) {
    switch (message.type) {
      case 'authenticate':
        this.handleAuthentication(clientId, message);
        break;
      case 'join_family':
        this.handleJoinFamily(clientId, message);
        break;
      case 'ping':
        this.sendToClient(clientId, { type: 'pong', data: {} });
        break;
      default:
        logger.warn(`Unknown WebSocket message type: ${message.type}`);
    }
  }

  private handleAuthentication(clientId: string, message: WebSocketMessage) {
    const { userId } = message.data;
    
    if (userId) {
      // Associate client with user
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(clientId);

      this.sendToClient(clientId, {
        type: 'authenticated',
        data: { userId, message: 'Authentication successful' }
      });

      logger.info(`Client ${clientId} authenticated as user ${userId}`);
    }
  }

  private handleJoinFamily(clientId: string, message: WebSocketMessage) {
    const { familyId } = message.data;
    
    if (familyId) {
      this.sendToClient(clientId, {
        type: 'family_joined',
        data: { familyId, message: `Joined family ${familyId}` }
      });

      logger.info(`Client ${clientId} joined family ${familyId}`);
    }
  }

  private handleDisconnection(clientId: string) {
    // Remove client from all user associations
    for (const [userId, clientIds] of this.userSockets.entries()) {
      clientIds.delete(clientId);
      if (clientIds.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    this.clients.delete(clientId);
    logger.info(`WebSocket client disconnected: ${clientId}`);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for sending messages
  public sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  public sendToUser(userId: string, message: WebSocketMessage) {
    const clientIds = this.userSockets.get(userId);
    if (clientIds) {
      clientIds.forEach(clientId => {
        this.sendToClient(clientId, message);
      });
    }
  }

  public broadcastToFamily(familyId: string, message: WebSocketMessage) {
    // This would require family membership data
    // For now, broadcast to all connected clients
    this.broadcast(message);
  }

  public broadcast(message: WebSocketMessage) {
    this.clients.forEach((client, clientId) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Notification methods for real-time updates
  public notifyMemoryCreated(userId: string, familyId: string, memory: any) {
    this.sendToUser(userId, {
      type: 'memory_created',
      data: { memory },
      userId,
      familyId
    });
  }

  public notifyInheritanceTokenCreated(userId: string, familyId: string, token: any) {
    this.sendToUser(userId, {
      type: 'inheritance_token_created',
      data: { token },
      userId,
      familyId
    });
  }

  public notifyAIStoryGenerated(userId: string, familyId: string, story: any) {
    this.sendToUser(userId, {
      type: 'ai_story_generated',
      data: { story },
      userId,
      familyId
    });
  }

  public notifyVaultSealed(userId: string, familyId: string, vault: any) {
    this.sendToUser(userId, {
      type: 'vault_sealed',
      data: { vault },
      userId,
      familyId
    });
  }

  public notifySystemMaintenance(message: string) {
    this.broadcast({
      type: 'system_maintenance',
      data: { message }
    });
  }

  // Health check
  public getStats() {
    return {
      totalClients: this.clients.size,
      authenticatedUsers: this.userSockets.size,
      timestamp: new Date().toISOString()
    };
  }

  public close() {
    this.wss.close();
    logger.info('WebSocket server closed');
  }
}

export default WebSocketService;