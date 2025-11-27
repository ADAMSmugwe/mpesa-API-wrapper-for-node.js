/**
 * Token Storage Interface
 * Implement this interface to create custom token storage adapters
 */
export interface TokenStorage {
  /**
   * Store the access token
   * @param token - The OAuth access token
   * @param expiresIn - Expiry time in seconds
   */
  set(token: string, expiresIn: number): Promise<void> | void;

  /**
   * Retrieve the stored access token
   * @returns The token if available and not expired, null otherwise
   */
  get(): Promise<string | null> | string | null;

  /**
   * Clear/invalidate the stored token
   */
  clear(): Promise<void> | void;

  /**
   * Check if token exists and is valid
   */
  isValid(): Promise<boolean> | boolean;
}

/**
 * In-Memory Token Storage (Default)
 * Stores tokens in application memory
 * Token is lost when application restarts
 */
export class MemoryTokenStorage implements TokenStorage {
  private token: string | null = null;
  private expiry: number | null = null;

  set(token: string, expiresIn: number): void {
    this.token = token;
    // Store expiry time in milliseconds (subtract 60 seconds for safety margin)
    this.expiry = Date.now() + (expiresIn - 60) * 1000;
  }

  get(): string | null {
    if (this.token && this.isValid()) {
      return this.token;
    }
    return null;
  }

  clear(): void {
    this.token = null;
    this.expiry = null;
  }

  isValid(): boolean {
    return this.token !== null && this.expiry !== null && Date.now() < this.expiry;
  }

  getExpiry(): number | null {
    return this.expiry;
  }
}

/**
 * Redis Token Storage
 * Stores tokens in Redis for distributed systems
 * Requires: redis or ioredis package
 */
export class RedisTokenStorage implements TokenStorage {
  private readonly keyPrefix: string;
  private readonly client: any;

  constructor(redisClient: any, options: { keyPrefix?: string } = {}) {
    this.client = redisClient;
    this.keyPrefix = options.keyPrefix || 'mpesa:token';
  }

  async set(token: string, expiresIn: number): Promise<void> {
    const key = `${this.keyPrefix}:access_token`;
    // Subtract 60 seconds for safety margin
    await this.client.setex(key, expiresIn - 60, token);
  }

  async get(): Promise<string | null> {
    const key = `${this.keyPrefix}:access_token`;
    return await this.client.get(key);
  }

  async clear(): Promise<void> {
    const key = `${this.keyPrefix}:access_token`;
    await this.client.del(key);
  }

  async isValid(): Promise<boolean> {
    const token = await this.get();
    return token !== null;
  }
}

/**
 * File System Token Storage
 * Stores tokens in a JSON file
 * Useful for development/testing
 */
export class FileTokenStorage implements TokenStorage {
  private readonly filePath: string;

  constructor(filePath: string = '.mpesa-token.json') {
    this.filePath = filePath;
  }

  set(token: string, expiresIn: number): void {
    const fs = require('fs');
    const data = {
      token,
      expiry: Date.now() + (expiresIn - 60) * 1000,
    };
    fs.writeFileSync(this.filePath, JSON.stringify(data), 'utf-8');
  }

  get(): string | null {
    try {
      const fs = require('fs');
      if (!fs.existsSync(this.filePath)) {
        return null;
      }
      const data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      if (data.expiry && Date.now() < data.expiry) {
        return data.token;
      }
      return null;
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.filePath)) {
        fs.unlinkSync(this.filePath);
      }
    } catch {
      // Ignore errors
    }
  }

  isValid(): boolean {
    return this.get() !== null;
  }
}

/**
 * Database Token Storage Example (Abstract)
 * Extend this for MySQL, PostgreSQL, MongoDB, etc.
 */
export abstract class DatabaseTokenStorage implements TokenStorage {
  protected abstract tableName: string;

  abstract set(token: string, expiresIn: number): Promise<void>;
  abstract get(): Promise<string | null>;
  abstract clear(): Promise<void>;
  
  async isValid(): Promise<boolean> {
    const token = await this.get();
    return token !== null;
  }
}

/**
 * MongoDB Token Storage Example
 */
export class MongoDBTokenStorage extends DatabaseTokenStorage {
  protected tableName = 'mpesa_tokens';
  private collection: any;

  constructor(mongoCollection: any) {
    super();
    this.collection = mongoCollection;
  }

  async set(token: string, expiresIn: number): Promise<void> {
    await this.collection.updateOne(
      { _id: 'mpesa_access_token' },
      {
        $set: {
          token,
          expiresAt: new Date(Date.now() + (expiresIn - 60) * 1000),
        },
      },
      { upsert: true }
    );
  }

  async get(): Promise<string | null> {
    const doc = await this.collection.findOne({
      _id: 'mpesa_access_token',
      expiresAt: { $gt: new Date() },
    });
    return doc?.token || null;
  }

  async clear(): Promise<void> {
    await this.collection.deleteOne({ _id: 'mpesa_access_token' });
  }
}
