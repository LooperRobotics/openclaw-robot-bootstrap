# ROS Topic Control Skill

Control robot behavior through ROS 2 topic publishing and service calls within OpenClaw agents via docker exec.

## Overview

This skill provides OpenClaw agents with direct access to ROS 2 topics and services running in the `ros-humble-core` sidecar container. Agents communicate via `docker exec`, enabling secure inter-container command execution. Agents can publish to topics, subscribe to topics, and invoke services to control robot hardware.

## Architecture

```
OpenClaw Gateway Container
    ↓ docker exec
ROS Humble Container (ros-humble-core)
    ↓ DDS multicast
Robot Hardware / Middleware
```

## Setup

The ROS Humble sidecar must be running (via `docker compose up`). Ensure:

1. ROS sidecar container named `ros-humble-core` is running
2. Docker socket is mounted in OpenClaw gateway (`/var/run/docker.sock`)
3. OpenClaw gateway has permission to run `docker exec`
4. ROS_DOMAIN_ID matches across all ROS nodes

## Usage Examples

### Publishing to a Topic

```javascript
const ROSTopicControl = require('./skills/ros-topic-control');
const ros = new ROSTopicControl({
  containerName: 'ros-humble-core',
  domainId: '0',
  timeout: 5000
});

// Publish a string message
const result = await ros.publishTopic(
  '/robot_cmd',
  'std_msgs/String',
  'data: move_forward'
);

if (result.success) {
  console.log('Published:', result.message);
} else {
  console.error('Failed:', result.error);
}
```

### Subscribing to a Topic

```javascript
// Listen to robot state (receive one message)
const result = await ros.subscribeTopic('/robot_state');
if (result.success) {
  console.log('Robot state:', result.data);
}
```

### Calling a Service

```javascript
// Invoke a service
const result = await ros.callService(
  '/robot_arm',
  'std_srvs/Trigger'
);
if (result.success) {
  console.log('Service response:', result.response);
}
```

### Full Agent Example

```javascript
// robot_controller.js - Agent task
const { moveRobot, triggerGripper } = require('./skills/ros-topic-control/examples');

async function executeRobotTask() {
  // Move forward
  let result = await moveRobot('forward');
  console.log(result.success ? 'Moving...' : `Error: ${result.error}`);

  // Wait
  await new Promise(r => setTimeout(r, 2000));

  // Trigger gripper
  result = await triggerGripper();
  console.log(result.success ? 'Gripper triggered' : `Error: ${result.error}`);

  // Stop
  await moveRobot('stop');
}

executeRobotTask();
```

## Common ROS Messages

### std_msgs/String
```
data: "message_content"
```

### std_msgs/Float64
```
data: 3.14
```

### geometry_msgs/Twist (velocity)
```
linear:
  x: 1.0
  y: 0.0
  z: 0.0
angular:
  x: 0.0
  y: 0.0
  z: 0.5
```

## Debugging

Check ROS container status:
```bash
docker ps | grep ros-humble
```

List available topics:
```bash
docker exec ros-humble-core ros2 topic list
```

Inspect topic messages:
```bash
docker exec ros-humble-core ros2 topic echo /topic_name
```

Find all services:
```bash
docker exec ros-humble-core ros2 service list
```

Call a service manually:
```bash
docker exec ros-humble-core ros2 service call /service_name std_srvs/Trigger
```

View ROS sidecar logs:
```bash
docker logs ros-humble-core
```

## Environment Integration

Container name and ROS Domain ID can be customized:

```javascript
const ros = new ROSTopicControl({
  containerName: 'my-ros-container',  // default: 'ros-humble-core'
  domainId: '1',                      // default: env.ROS_DOMAIN_ID or '0'
  timeout: 10000                      // default: 5000ms
});
```

## Performance Notes

- Topic publishing: ~50-100ms (includes docker exec overhead)
- Service calls: ~100-200ms (includes docker exec overhead)
- Uses `--once` flag to avoid long-running subscriptions
- Batch topic publishes when controlling multiple joints
- Docker exec adds ~30-50ms latency per command

## Error Handling

All methods return a result object:

```javascript
{
  success: boolean,
  message?: string,      // for publishTopic
  data?: string,         // for subscribeTopic
  response?: string,     // for callService
  topics?: string[],     // for listTopics
  services?: string[],   // for listServices
  error?: string         // on failure
}
```

Example error handling:

```javascript
const result = await ros.publishTopic(topic, type, data);
if (!result.success) {
  console.error('ROS operation failed:', result.error);
  // Handle: container not running, permission denied, command timeout, etc.
}
```

## Security

- ROS runs on localhost inside containers (network isolated)
- Docker socket required (inherited from gateway setup)
- Use Tailscale + OpenClaw gateway for remote access
- Consider DDS security profiles for production
- Audit docker exec command execution in logs

## Related

- [ROS 2 Documentation](https://docs.ros.org/en/humble/)
- [OpenClaw Gateway](../README.md)
- [docker-compose.yml](../docker-compose.yml)
