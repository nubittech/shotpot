import { Injectable, Logger } from "@nestjs/common";
import { Pool, QueryResultRow } from "pg";

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool | null;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    this.pool = connectionString ? new Pool({ connectionString }) : null;
  }

  isEnabled() {
    return Boolean(this.pool);
  }

  async query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
    if (!this.pool) {
      throw new Error("database_not_configured");
    }

    try {
      return await this.pool.query<T>(text, values);
    } catch (error) {
      this.logger.error(`Database query failed: ${text}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async queryOptional<T extends QueryResultRow>(text: string, values: unknown[] = []) {
    if (!this.pool) {
      return null;
    }

    return this.query<T>(text, values);
  }
}
