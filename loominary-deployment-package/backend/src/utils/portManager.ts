import net from 'net';
import { logger } from './logger';

export class PortManager {
  private static instance: PortManager;
  private usedPorts: Set<number> = new Set();
  private readonly minPort: number = 3000;
  private readonly maxPort: number = 65535;

  private constructor() {}

  static getInstance(): PortManager {
    if (!PortManager.instance) {
      PortManager.instance = new PortManager();
    }
    return PortManager.instance;
  }

  async findAvailablePort(preferredPort?: number): Promise<number> {
    if (preferredPort && await this.isPortAvailable(preferredPort)) {
      this.usedPorts.add(preferredPort);
      return preferredPort;
    }

    // Try ports in range
    for (let port = this.minPort; port <= this.maxPort; port++) {
      if (!this.usedPorts.has(port) && await this.isPortAvailable(port)) {
        this.usedPorts.add(port);
        return port;
      }
    }

    throw new Error('No available ports found');
  }

  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  releasePort(port: number): void {
    this.usedPorts.delete(port);
    logger.info(`Released port ${port}`);
  }

  getUsedPorts(): number[] {
    return Array.from(this.usedPorts);
  }

  async getRecommendedPorts(): Promise<{
    backend: number;
    frontend: number;
    ai: number;
  }> {
    const backend = await this.findAvailablePort(3001);
    const frontend = await this.findAvailablePort(5173);
    const ai = await this.findAvailablePort(11434);

    return { backend, frontend, ai };
  }
}

export const portManager = PortManager.getInstance();