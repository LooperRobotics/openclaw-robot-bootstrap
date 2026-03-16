# ROS Topic Control Skill

Control robot behavior through ROS 2 topic publishing and service calls within OpenClaw agents.

## Overview

This skill provides OpenClaw agents with direct access to ROS 2 topics and services running in the ros-humble sidecar. Agents can publish to topics, subscribe to topics, and invoke services to control robot hardware.

## Setup

The ROS Humble sidecar must be running (via `docker compose up`). Ensure:

1. ROS sidecar is on host network
2. OpenClaw gateway can reach localhost (which it can via host network)
3. ROS_DOMAIN_ID matches across all ROS nodes

## Usage Examples

### Publishing to a Topic

```javascript
// Inside an OpenClaw agent
const { exec } = require('child_process');

// Publish a string message
exec("ros2 topic pub --once /robot_cmd std_msgs/String 'data: move_forward'", (err, stdout, stderr) => {
  if (err) console.error('ROS pub failed:', stderr);
  console.log('Published to /robot_cmd');
});
```

### Subscribing to a Topic

```javascript
// Listen to robot state
exec("ros2 topic echo /robot_state --once", (err, stdout, stderr) => {
  if (err) return;
  console.log('Robot state:', stdout);
});
```

### Calling a Service

```javascript
// Invoke a service
exec("ros2 service call /robot_arm std_srvs/Trigger", (err, stdout, stderr) => {
  if (err) console.error('Service call failed:', stderr);
  console.log('Service response:', stdout);
});
```

### Full Agent Example

```javascript
// robot_controller.js - Agent task
async function moveRobot(direction) {
  return new Promise((resolve, reject) => {
    const cmd = `ros2 topic pub --once /robot_cmd std_msgs/String 'data: ${direction}'`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr));
      resolve(`Moved ${direction}`);
    });
  });
}

// Usage in agent
await moveRobot('forward');
await moveRobot('left');
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

List available topics:
```bash
docker compose exec ros-humble ros2 topic list
```

Inspect topic messages:
```bash
docker compose exec ros-humble ros2 topic echo /topic_name
```

Find all services:
```bash
docker compose exec ros-humble ros2 service list
```

Call a service manually:
```bash
docker compose exec ros-humble ros2 service call /service_name std_srvs/Trigger
```

## Environment Integration

Set ROS environment in agent:

```javascript
const env = {
  ...process.env,
  ROS_DOMAIN_ID: process.env.ROS_DOMAIN_ID || '0',
  ROS_LOCALHOST_ONLY: '0'
};

exec(cmd, { env }, callback);
```

## Performance Notes

- Topic publishing is **fast** (~10ms latency)
- Service calls include round-trip latency (depends on handler)
- Use `--once` flag to avoid long-running subscriptions
- Batch topic publishes when controlling multiple joints

## Security

- ROS is unencrypted by default (runs on localhost)
- Use Tailscale + OpenClaw gateway for remote access
- Consider DDS security profiles for production deployments

## Related

- [ROS 2 Documentation](https://docs.ros.org/en/humble/)
- [OpenClaw Gateway](../README.md)
- [robot-control-setup branch](../../#robot-control-setup)
