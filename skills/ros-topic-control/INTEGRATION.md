# ROS Topic Control - Integration Guide

This skill enables OpenClaw agents to control ROS 2 robots via docker exec.

## Quick Start

1. **In your OpenClaw agent:**

```javascript
const ROSTopicControl = require('/path/to/skills/ros-topic-control');

const ros = new ROSTopicControl({
  containerName: 'ros-humble-core',
  domainId: '0'
});

// Publish a command
const result = await ros.publishTopic('/robot_cmd', 'std_msgs/String', 'data: execute_action');
if (!result.success) console.error(result.error);

// Call a service
const srv = await ros.callService('/robot_arm', 'std_srvs/Trigger');

// List available topics
const topics = await ros.listTopics();
console.log('Available topics:', topics.topics);
```

2. **Or use convenience functions:**

```javascript
const { moveRobot, triggerGripper } = require('./examples');

await moveRobot('forward');
await triggerGripper();
```

## Architecture

```
OpenClaw Agent (gateway container)
    ↓ docker exec
ROS Humble Core (ros-humble-core container, host network)
    ↓ DDS multicast
Robot Hardware / Middleware
```

The docker exec approach:
- No network configuration needed
- Uses Docker socket for cross-container communication
- Secure: confined to local Docker daemon
- Fast: sub-100ms overhead per command

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
  // Possible errors:
  // - "Cannot connect to ros-humble-core: container not found"
  // - "Docker permission denied: unable to run docker exec"
  // - "ROS command timeout: exceeded 5000ms"
  // - "bash: ros2: command not found"
}
```

### Discovery Pattern
```javascript
async function discoverRobot() {
  const topics = await ros.listTopics();
  const services = await ros.listServices();
  
  if (!topics.success) return console.error('Failed to list topics:', topics.error);
  if (!services.success) return console.error('Failed to list services:', services.error);
  
  console.log('Robot topics:', topics.topics);
  console.log('Robot services:', services.services);
  
  return { topics: topics.topics, services: services.services };
}
```

### Conditional Control
```javascript
async function smartControl() {
  // Check if topic exists
  const topics = await ros.listTopics();
  if (!topics.topics.includes('/cmd_vel')) {
    console.error('No velocity topic available');
    return;
  }

  // Execute control
  await ros.publishTopic('/cmd_vel', 'geometry_msgs/Twist', 'linear: {x: 1.0}');
}
```

## Debugging

Check if ROS sidecar is running:
```bash
docker compose ps
docker ps | grep ros-humble
```

Inspect ROS nodes:
```bash
docker exec ros-humble-core ros2 node list
```

Monitor topic traffic:
```bash
docker exec ros-humble-core ros2 topic echo /topic_name
```

Check Docker permissions:
```bash
docker ps  # Can you run docker commands?
# If permission denied: add user to docker group
sudo usermod -aG docker $USER
```

Check sidecar logs:
```bash
docker logs ros-humble-core
docker logs -f ros-humble-core  # Follow logs
```

Manual docker exec test:
```bash
docker exec ros-humble-core bash -c "source /opt/ros/humble/setup.bash && ros2 topic list"
```

## Performance Tips

- **Latency breakdown per command:**
  - Docker exec: ~30-50ms
  - ROS CLI startup: ~20-40ms
  - Actual operation: ~5-20ms
  - Total: ~50-110ms per command

- **Optimization:**
  - Batch operations when possible
  - Reuse ROSTopicControl instance
  - Use `--once` flag (included by default)
  - Increase timeout for slow networks (default 5s)

- **Scaling:**
  - For high-frequency control (>10Hz), consider a bridge node instead
  - Docker exec is suitable for infrequent commands
  - Agent turn time: expect 100-200ms overhead

## Configuration

```javascript
// Full options
const ros = new ROSTopicControl({
  containerName: 'ros-humble-core',  // Docker container name (required)
  domainId: '0',                     // ROS_DOMAIN_ID (0-232)
  timeout: 5000                      // Command timeout in ms
});
```

Environment variables:
```bash
ROS_DOMAIN_ID=0        # Default ROS domain
ROS_LOCALHOST_ONLY=0   # Allow DDS multicast (required)
```

## Network Architecture

```
Host Machine
├─ Docker Daemon
│  ├─ OpenClaw Gateway Container (service:tailscale)
│  │  ├─ Node.js runtime
│  │  ├─ Agent code
│  │  └─ Docker socket (/var/run/docker.sock)
│  │
│  ├─ ROS Humble Core Container (host network)
│  │  ├─ ROS 2 Humble
│  │  ├─ DDS middleware
│  │  └─ ros2 CLI tools
│  │
│  └─ Tailscale Container (network bridge)
│
└─ Host Networking
   ├─ Localhost (127.0.0.1)
   ├─ Tailscale MagicDNS
   └─ Robot Hardware (if connected to host)
```

## Troubleshooting

**Problem:** "Cannot connect to ros-humble-core"
```bash
# Solution: Check container name and status
docker ps | grep ros
docker compose ps
```

**Problem:** "Docker permission denied"
```bash
# Solution: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
# Then restart OpenClaw gateway
```

**Problem:** "ROS command timeout"
```bash
# Increase timeout
const ros = new ROSTopicControl({ timeout: 10000 });

# Or check if ROS sidecar is responsive
docker exec ros-humble-core ros2 topic list  # Manual test
```

**Problem:** "bash: ros2: command not found"
```bash
# Check ROS installation in container
docker exec ros-humble-core which ros2
docker exec ros-humble-core ls /opt/ros/

# Solution: Rebuild sidecar if corrupted
docker compose down
docker compose build --pull
docker compose up -d
```

## Best Practices

1. **Always check result.success** before using result data
2. **Use try-catch** or .catch() for async error handling
3. **Test discovery** before sending commands
4. **Log docker exec stderr** for debugging
5. **Handle timeouts** gracefully (container lag, network)
6. **Batch sequential commands** when possible
7. **Use meaningful topic names** in robot setup
8. **Monitor container logs** for ROS errors

