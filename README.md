# PodKeeper

PodKeeper is an open-source library for starting and stopping Docker containers in a way that ensures they won’t linger if the host program crashes or exits unexpectedly without properly stopping them.

## How It Works

Each Docker container has a primary process, known as the "entrypoint," which keeps the container running. For example, when you start a PostgreSQL container, it runs the `postgres` binary. When this binary exits, the container stops as well.

PodKeeper wraps the entrypoint in a special binary called `deadmanswitch`, which not only starts the entrypoint but also launches a WebSocket server. The client that initiated the container must connect to this WebSocket server; otherwise, the container will self-terminate after 10 seconds.

This setup creates a connection between the launched container and its owner. Whenever this WebSocket disconnects, the `deadmanswitch` program automatically stops the container.

## PodKeeper vs. TestContainers

Both PodKeeper and [TestContainers](https://testcontainers.com/) address the problem of starting, stopping, and cleaning up Docker containers:

- **TestContainers** uses a dedicated Docker container called "Ryuk" to handle cleanup.
- **PodKeeper** manages cleanup using a [dead man's switch](https://en.wikipedia.org/wiki/Dead_man%27s_switch) mechanism.

While TestContainers is a well-established solution with a solid industry record, PodKeeper is an experimental approach exploring an alternative cleanup method.
