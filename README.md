# PodKeeper

> ⚠️ **Warning:** PodKeeper is currently in pre-1.0.0 release. Expect potential changes and experimental features that may not be fully stable yet.

PodKeeper is a node.js open-source library for starting and stopping Docker containers in a way that ensures they won’t linger if the host program crashes or exits unexpectedly without properly stopping them.

PodKeeper is written in TypeScript and comes bundled with TypeScript types.

- [Getting Started](#getting-started)
- [Bundled Services & API](#bundled-services--api)
- [How It Works](#how-it-works)
- [PodKeeper vs. TestContainers](#podkeeper-vs-testcontainers)

## Getting Started

1. Install podkeeper:

    ```sh
    npm i --save-dev podkeeper
    ```

1. Pull container you wish to launch beforehand:

    ```sh
    docker pull postgres:latest
    ```

1. Start / stop container programmatically:

    ```ts
    import { Postgres } from 'podkeeper';

    const postgres = await Postgres.start();
    // do something with container...
    await postgres.stop();
    ```

## Bundled services & API

PodKeeper comes bundled with the following pre-configured services:

* MySQL:

    ```ts
    import { MySQL } from 'podkeeper';
    ```

* Postgres

    ```ts
    import { Postgres } from 'podkeeper';
    ```

* Minio

    ```ts
    import { Minio } from 'podkeeper';
    ```

If a popular service is missing, please do not hesitate to submit a pull request.
Alternatively, you can launch a generic container service with the `GenericService` class:

```ts
import { GenericService } from 'podkeeper';

cosnt service = await GenericService.start({
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
});
```

## How It Works

Each Docker container has a primary process, known as the "entrypoint," which keeps the container running. For example, when you start a PostgreSQL container, it runs the `postgres` binary. When this binary exits, the container stops as well.

PodKeeper wraps the entrypoint in a special binary called `deadmanswitch`, which not only starts the entrypoint but also launches a WebSocket server. The client that initiated the container must connect to this WebSocket server; otherwise, the container will self-terminate after 10 seconds.

This setup creates a connection between the launched container and its owner. Whenever this WebSocket disconnects, the `deadmanswitch` program automatically stops the container.

## PodKeeper vs. TestContainers

Both PodKeeper and [TestContainers](https://testcontainers.com/) provide solutions for starting, stopping, and cleaning up Docker containers:

- **TestContainers** uses a dedicated Docker container called "Ryuk" to manage cleanup.
- **PodKeeper** relies on a [dead man's switch](https://en.wikipedia.org/wiki/Dead_man%27s_switch) mechanism for cleanup.

While TestContainers is a mature, industry-proven tool, PodKeeper is an experimental alternative that explores a different approach.

There are also some notable differences in API design philosophy:

- **Process Behavior**: PodKeeper services prevent the Node.js process from exiting, while TestContainers services do not.
- **Container Pulling**: PodKeeper does not implicitly pull containers, requiring them to be available beforehand, whereas TestContainers lazily pulls containers as needed when launching a service.
- **Healthchecks**: The services that PodKeeper ships out-of-the-box are pre-configured to use proper healthchecks.

## Publishing

To publish a new version:

```sh
pnpm version minor -m "chore: mark v%s"  # or: pnpm version patch -m "chore: mark v%s"
git push --tags upstream main
```

The GitHub Actions workflow will automatically build and publish to npm when the tag is pushed.
