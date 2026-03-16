# ROS Topic Control - Integration Guide

This skill enables OpenClaw agents to control ROS 2 robots.

## Quick Start

1. **In your OpenClaw agent:**

```javascript
const ROSTopicControl = require('/path/to/skills/ros-topic-control');

const ros = new ROSTopicControl();

// Publish a command
await ros.publishTopic('/robot_cmd', 'std_msgs/String', 'data: execute_action');

// Call a service
await ros.callService('/robot_arm', 'std_srvs/Trigger');

// List available topics
const topics = await ros.listTopics();
console.log('Available topics:', topics);
```

2. **Or use convenience functions:**

```javascript
const { moveRobot, triggerGripper } = require('./examples');

await moveRobot('forward');
await triggerGripper();
```

## Message Types Reference

### Motion Control (geometry_msgs/Twist)
```
linear:
  x: 1.0    # forward/backward
  y: 0.0    # left/right
  z: 0.0    # up/down
angular:
  x: 0.0    # roll
  y: 0.0    # pitch
  z: 0.5    # yaw (rotation)
```

### Generic String (std_msgs/String)
```
data: "command_text"
```

### Generic Float (std_msgs/Float64)
```
data: 3.14159
```

## Common Patterns

### Sequential Actions
```javascript
await ros.publishTopic('/cmd_vel', 'geometry_msgs/Twist', 
  'linear: {x: 1.0} angular: {x: 0.0, y: 0.0, z: 0.0}');
await new Promise(r => setTimeout(r, 2000)); // wait 2s
await ros.publishTopic('/cmd_vel', 'geometry_msgs/Twist',
  'linear: {x: 0.0} angular: {x: 0.0, y: 0.0, z: 0.0}');
```

### Error Handling
```javascript
const result = await ros.publishTopic('/robot_cmd', 'std_msgs/String', 'data: test');
if (!result.success) {
  console.error('Failed to publish:', result.error);
}
```

### Discovery
```javascript
const { topics, services } = await ros.discoverRobotTopics();
topics.topics.forEach(t => console.log('Topic:', t));
services.services.forEach(s => console.log('Service:', s));
```

## Debugging

Check if ROS sidecar is running:
```bash
docker compose ps
```

Inspect ROS nodes:
```bash
docker compose exec ros-humble ros2 node list
```

Monitor topic traffic:
```bash
docker compose exec ros-humble ros2 topic echo /topic_name
```

Check sidecar logs:
```bash
docker compose logs ros-humble
```

## Performance Tips

- Use `--once` flag (included in helper) to avoid blocking
- Batch topic publishes for efficiency
- ROS round-trip latency: ~10-50ms
- Set appropriate timeouts for slow operations
- Use services for critical operations (guaranteed delivery)

## Network Architecture

```
OpenClaw Agent (gateway container, service:tailscale)
    ↓ localhost
ROS Humble (host network)
    ↓ DDS multicast
Robot Hardware / Middleware
```

Agents communicate with ROS via localhost. ROS directly interfaces with robot hardware.
