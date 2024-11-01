import ms from 'ms';
import { GenericService } from './genericService.js';

const IMAGE_NAME = 'postgres:latest';
const POSTGRES_PORT = 5432;

export class Postgres {
  static async start({ user = 'user', password = 'password', db = 'postgres' } = {}) {
    const service = await GenericService.start({
      imageName: 'postgres:latest',
      ports: [POSTGRES_PORT],
      healthcheck: {
        test: ['CMD-SHELL', 'pg_isready'],
        intervalMs: ms('1s'),
        retries: 10,
        startPeriodMs: 0,
        timeoutMs: ms('5s'),
      },
      env: {
        'POSTGRES_USER': user,
        'POSTGRES_PASSWORD': password,
        'POSTGRES_DB': db,
        // Duplicate env variables for the healthchecks.
        'PGUSER': user,
        'PGPASSWORD': password,
        'PGDATABASE': db,
      },
    });
    return new Postgres(service, user, password, db);
  }

  constructor(
    private _service: GenericService,
    private _user: string,
    private _password: string,
    private _db: string
  ) {
  }

  databaseUrl() { return `postgres://${this._user}:${this._password}@localhost:${this._service.mappedPort(POSTGRES_PORT)!}/${this._db}`; }
  connectOptions() {
    return {
      host: 'localhost',
      port: this._service.mappedPort(POSTGRES_PORT)!,
      database: this._db,
      user: this._user,
      password: this._password,
    };
  }
  async stop() {
    await this._service.stop();
  }
}
