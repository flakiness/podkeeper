import { WebSocket } from 'ws';
import * as dockerApi from './dockerApi.js';

export class GenericService {
  static async launch(options: {
    imageName: string,
    containerServicePort: number,
    healthcheck?: {
      test: string[],
      intervalMs: number,
      retries: number,
      startPeriodMs: number,
      timeoutMs: number,
    },
    command?: string[],
    env?: { [key: string]: string | number | boolean | undefined };
  }) {
    const images = await dockerApi.listImages();
    const imageName = options.imageName + '-deadmanswitch';
    const image = images.find(image => image.names.includes(options.imageName));
    if (!image)
      throw new Error(`ERROR: no image named "${imageName}" - run 'npx deadmanswitch-pull ${options.imageName}'`);

    const containerId = await dockerApi.launchContainer({
      imageId: image.imageId,
      autoRemove: true,
      ports: [
        { container: options.containerServicePort, host: 0 },
        { container: 54321, host: 0, }
      ],
      healthcheck: options.healthcheck,
      command: options.command,
      env: options.env,
    });
    const container = (await dockerApi.listContainers()).find(container => container.containerId === containerId);
    if (!container)
      throw new Error('ERROR: failed to launch container!');  
    const serviceBinding = container.portBindings.find(binding => binding.containerPort === options.containerServicePort);
    const switchBinding = container.portBindings.find(binding => binding.containerPort === 54321);
    if (!serviceBinding || !serviceBinding.hostPort || !switchBinding || !switchBinding.hostPort) {
      await dockerApi.stopContainer({ containerId: container.containerId });
      throw new Error('Failed to expose service to host');
    }
    const ws = new WebSocket(`ws://localhost:${switchBinding.hostPort}`);
    const wsConnectionPromise = new Promise<void>((resolve, reject) => {
      ws.on('open', () => resolve());
      ws.on('error', reject);
    });
    await wsConnectionPromise;
    const service = new GenericService(containerId, serviceBinding.hostPort, ws);

    while (!(await dockerApi.isContainerHealthy(container.containerId)))
      await new Promise(x => setTimeout(x, 100));

    return service;
  }

  constructor(
    private _containerId: string,
    private _servicePort: number,
    private _ws: WebSocket,
  ) {
  }

  port() { return this._servicePort; }

  async stop() {
    this._ws.close();
    await dockerApi.stopContainer({ containerId: this._containerId });
  }
}
