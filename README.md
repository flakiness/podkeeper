# PodKeeper

PodKeeper is an open-source library for starting and stopping Docker containers in a way that ensures they won’t linger if the host program crashes or exits unexpectedly without properly stopping them.

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

