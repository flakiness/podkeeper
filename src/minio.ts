import ms from 'ms';
import { GenericService } from './genericService.js';

export class Minio {
  static async start({
    accessKeyId = 'root',
    secretAccessKey = 'password',
    hostApiPort = 0,
    hostWebuiPort = 0,
  } = {}) {
    const service = await GenericService.start({
      imageName: 'quay.io/minio/minio:latest',
      ports: [{
        container: 9000,
        host: hostApiPort,
      }, {
        container: 9090,
        host: hostWebuiPort,
      }],
      healthcheck: {
        test: ['CMD', `mc`, `ready`, `local`],
        intervalMs: ms('100ms'),
        retries: 10,
        startPeriodMs: ms('30s'),
        timeoutMs: ms('5s'),
      },
      env: {
        'MINIO_ROOT_USER': accessKeyId,
        'MINIO_ROOT_PASSWORD': secretAccessKey,
      },
      command: [
        'server', '/data', '--console-address', ":9090"
      ]
    });
    return new Minio(service, accessKeyId, secretAccessKey);
  }

  constructor(
    private _service: GenericService,
    private _accessKeyId: string,
    private _secretAccessKey: string,
  ) {
  }

  accessKeyId() { return this._accessKeyId; }
  secretAccessKey() { return this._secretAccessKey; }
  apiEndpoint() { return 'http://localhost:' + this._service.mappedPort(9000)!; }
  webuiEndpoint() { return 'http://localhost:' + this._service.mappedPort(9090)!; }

  async stop() {
    await this._service.stop();
  }
}
