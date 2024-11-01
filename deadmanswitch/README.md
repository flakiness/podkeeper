# DeadManSwitch

DeadManSwitch is a lightweight Go program that runs a specified command with arguments and simultaneously starts a WebSocket signaling server.

## Program Behavior

DeadManSwitch operates with the following behavior:

1. If the launched command exits, DeadManSwitch exits as well.
2. If no client connects to the WebSocket signaling server within `DEADMANSWITCH_TIMEOUT` seconds (default is 10 seconds), the process terminates.
3. If a client connects but then disconnects, the process terminates.

## Configuration

You can configure DeadManSwitch using the following environment variables:

- **`DEADMANSWITCH_TIMEOUT`**: Sets the timeout (in seconds) to wait for clients to connect to the WebSocket signaling server. Default is 10 seconds.
- **`DEADMANSWITCH_PORT`**: Specifies the port to run the server on.
- **`DEADMANSWITCH_SUFFIX`**: Defines a suffix for the WebSocket URL endpoint.

## Usage Example

The following command launches `sleep 100` and accepts WebSocket connections on `ws://localhost:54321/foobar`:

```bash
DEADMANSWITCH_TIMEOUT=10 \
DEADMANSWITCH_PORT=54321 \
DEADMANSWITCH_SUFFIX=foobar \
deadmanswitch sleep 100
```

## Compilation

To compile, run `./build.sh`
