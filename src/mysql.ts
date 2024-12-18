import ms from 'ms';
import { GenericService } from './genericService.js';

const MYSQL_IMAGE_NAME = 'mysql:latest';
const MYSQL_PORT = 3306;

export class MySQL {

  static async start({ db = 'mydatabase', rootPassword = 'rootpassword', hostPort = 0 } = {}) {
    const service = await GenericService.start({
      imageName: 'mysql:latest',
      ports: [{
        container: MYSQL_PORT,
        host: hostPort,
      }],
      healthcheck: {
        test: ['CMD-SHELL', `mysqladmin ping --host 127.0.0.1 -u root --password=${rootPassword}`],
        intervalMs: ms('100ms'),
        retries: 10,
        startPeriodMs: 0,
        timeoutMs: ms('5s'),
      },
      command: ['mysqld', '--innodb-force-recovery=0', '--skip-innodb-doublewrite'],
      env: {
        'MYSQL_ROOT_PASSWORD': rootPassword,
        'MYSQL_DATABASE': db,
        'MYSQL_INITDB_SKIP_TZINFO': true,
      },
    });

    return new MySQL(service, rootPassword, db);
  }

  constructor(
    private _service: GenericService,
    private _rootPassword: string,
    private _db: string,
  ) {
  }

  databaseUrl() { return `mysql://root:${this._rootPassword}@localhost:${this._service.mappedPort(MYSQL_PORT)!}/${this._db}`; }

  connectOptions() { 
    return {
      host: 'localhost',
      port: this._service.mappedPort(MYSQL_PORT)!,
      database: this._db,
      user: 'root',
      password: this._rootPassword,
    };
  }

  async stop() {
    await this._service.stop();
  }
}
