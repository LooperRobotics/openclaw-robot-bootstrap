/**
 * Example: Basic Robot Movement Controller
 * Demonstrates ROS topic publishing from an OpenClaw agent via docker exec
 */

const ROSTopicControl = require('./index');

const ros = new ROSTopicControl({
  containerName: 'ros-humble-core',
  domainId: process.env.ROS_DOMAIN_ID || '0',
  timeout: 5000
});

/**
 * Move robot in a direction
 */
async function moveRobot(direction) {
  const directions = {
    forward: 'linear: {x: 1.0, y: 0.0, z: 0.0} angular: {x: 0.0, y: 0.0, z: 0.0}',
    backward: 'linear: {x: -1.0, y: 0.0, z: 0.0} angular: {x: 0.0, y: 0.0, z: 0.0}',
    left: 'linear: {x: 0.0, y: 1.0, z: 0.0} angular: {x: 0.0, y: 0.0, z: 0.5}',
    right: 'linear: {x: 0.0, y: -1.0, z: 0.0} angular: {x: 0.0, y: 0.0, z: -0.5}',
    stop: 'linear: {x: 0.0, y: 0.0, z: 0.0} angular: {x: 0.0, y: 0.0, z: 0.0}'
  };

  if (!directions[direction]) {
    return { success: false, error: `Unknown direction: ${direction}` };
  }

  return await ros.publishTopic('/cmd_vel', 'geometry_msgs/Twist', directions[direction]);
}

/**
 * Get current robot state
 */
async function getRobotState() {
  return await ros.subscribeTopic('/robot_state');
}

/**
 * Trigger gripper
 */
async function triggerGripper() {
  return await ros.callService('/gripper_control', 'std_srvs/Trigger');
}

/**
 * List all available robot endpoints
 */
async function discoverRobotTopics() {
  const topics = await ros.listTopics();
  const services = await ros.listServices();
  return { topics, services };
}

// Export for agent use
module.exports = {
  moveRobot,
  getRobotState,
  triggerGripper,
  discoverRobotTopics,
  ros
};
