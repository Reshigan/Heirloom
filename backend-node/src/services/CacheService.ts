import Redis from 'ioredis';

class CacheService {
  private client: Redis | null = null;
  private isEnabled: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    
    if (redisUrl) {
      try {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            if (times > 3) {
              console.error('Redis connection failed after 3 retries');
              return null;
            }
            return Math.min(times * 100, 2000);
          },
          reconnectOnError: (err: Error) => {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
              return true;
            }
            return false;
          }
        });

        this.client.on('connect', () => {
          console.log('✅ Redis connected successfully');
          this.isEnabled = true;
        });

        this.client.on('error', (err: Error) => {
          console.error('❌ Redis error:', err.message);
          this.isEnabled = false;
        });

        this.client.on('close', () => {
          console.log('⚠️  Redis connection closed');
          this.isEnabled = false;
        });
      } catch (error) {
        console.error('Failed to initialize Redis:', error);
        this.client = null;
        this.isEnabled = false;
      }
    } else {
      console.log('⚠️  Redis not configured (REDIS_URL not set). Caching disabled.');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.isEnabled || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      await this.client.del(...keys);
      return keys.length;
    } catch (error) {
      console.error(`Cache invalidate pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isEnabled = false;
    }
  }

  isReady(): boolean {
    return this.isEnabled;
  }
}

export const cacheService = new CacheService();
