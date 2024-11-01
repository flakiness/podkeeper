import { setTimeout } from 'timers/promises';
import { WebSocket } from 'ws';
import * as dockerApi from './dockerApi.js';

import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function connectWebSocket(address: string, deadline: number): Promise<WebSocket|undefined> {
  while (Date.now() < deadline) {
    const socket = new WebSocket(address);
    const result = await new Promise<boolean>((resolve, reject) => {
      socket.on('open', () => resolve(true));
      socket.on('error', () => reject(false));
    });
    if (result)
      return socket;
    await setTimeout(100, undefined);
  }
  return undefined;
}

export class GenericService {
  static async launch(options: {
    imageName: string,
    ports: number[],
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
    const image = images.find(image => image.names.includes(options.imageName));
    if (!image)
      throw new Error(`ERROR: no image named "${options.imageName}" - run 'docker pull ${options.imageName}'`);

    const metadata = await dockerApi.inspectImage(image.imageId);
    const imageArch = metadata.Architecture;
    const entrypoint = ['/deadmanswitch'];
    const command = [metadata.Config.Entrypoint, options.command ?? metadata.Config.Cmd].flat();
    const deadmanswitchName = imageArch === 'arm64' ? 'deadmanswitch_linux_aarch64' : 'deadmanswitch_linux_x86_64';

    const usedPorts = new Set(options.ports);
    let switchPort = 54321;
    while (usedPorts.has(switchPort))
      ++switchPort;
    const containerId = await dockerApi.launchContainer({
      imageId: image.imageId,
      autoRemove: true,
      binds: [
        { containerPath: '/deadmanswitch', hostPath: path.join(__dirname, '..', 'deadmanswitch', 'bin', deadmanswitchName) },
      ],
      ports: [
        ...options.ports.map(port => ({ container: port, host: 0 })),
        { container: switchPort, host: 0, }
      ],
      entrypoint,
      command,
      healthcheck: options.healthcheck,
      env: options.env,
    });

    const deadline = Date.now() + 10000; // 10s is default timeout before deadmanswitch will kill container.
    const container = (await dockerApi.listContainers()).find(container => container.containerId === containerId);
    if (!container)
      throw new Error('ERROR: failed to launch container!');  

    const switchBinding = container.portBindings.find(binding => binding.containerPort === switchPort);
    if (!switchBinding || !switchBinding.hostPort) {
      await dockerApi.stopContainer({ containerId: container.containerId });
      throw new Error('Failed to expose service to host');
    }

    while (!(await dockerApi.isContainerHealthy(container.containerId)))
      await setTimeout(100, undefined);

    const ws = await connectWebSocket(`ws://localhost:${switchBinding.hostPort}/`, deadline);
    if (!ws)
      throw new Error('Failed to connect to launched container');
    const service = new GenericService(containerId, container.portBindings, ws);
    return service;
  }

  constructor(
    private _containerId: string,
    private _bindings: dockerApi.PortBinding[],
    private _ws: WebSocket,
  ) {
  }

  mappedPort(containerPort: number) {
    const binding = this._bindings.find(binding => binding.containerPort === containerPort)
    return binding?.hostPort;
  }

  async stop() {
    this._ws.close();
    await dockerApi.stopContainer({ containerId: this._containerId });
  }
}
