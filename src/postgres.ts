import ms from 'ms';
import { GenericService } from './genericService.js';

const IMAGE_NAME = 'postgres:latest';

export class Postgres {
  static async launch({ user = 'user', password = 'password', db = 'postgres' } = {}) {
    const service = await GenericService.launch({
      imageName: 'postgres:latest',
      containerServicePort: 5432,
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

  databaseUrl() { return `postgres://${this._user}:${this._password}@localhost:${this._service.port()}/${this._db}`; }
  connectOptions() {
    return {
      host: 'localhost',
      port: this._service.port(),
      database: this._db,
      user: this._user,
      password: this._password,
    };
  }
  async stop() {
    await this._service.stop();
  }
}
