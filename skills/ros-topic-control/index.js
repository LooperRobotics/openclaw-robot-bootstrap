/**
 * ROS Topic Control Helper
 * Simplifies ROS 2 topic publishing and service calls from OpenClaw agents
 * Uses docker exec to communicate with ros-humble sidecar container
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ROSTopicControl {
  constructor(options = {}) {
    this.containerName = options.containerName || 'ros-humble-core';
    this.domainId = options.domainId || process.env.ROS_DOMAIN_ID || '0';
    this.timeout = options.timeout || 5000;
  }

  /**
   * Build docker exec command with ROS environment setup
   * Note: Agent developers control the ROS commands; validate input at agent level
   */
  _buildDockerCmd(rosCmd) {
    const rosEnv = `ROS_DOMAIN_ID=${this.domainId} ROS_LOCALHOST_ONLY=0`;
    return `docker exec -e ${rosEnv} ${this.containerName} bash -c "source /opt/ros/humble/setup.bash && ${rosCmd}"`;
  }

  /**
   * Execute command in ROS container
   */
  async _execInROS(rosCmd) {
    const cmd = this._buildDockerCmd(rosCmd);
    try {
      const { stdout } = await execAsync(cmd, { timeout: this.timeout });
      return { success: true, stdout: stdout.trim() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Publish a message to a ROS topic
   * @param {string} topic - Topic name (e.g., '/robot_cmd')
   * @param {string} msgType - Message type (e.g., 'std_msgs/String')
   * @param {string} data - Message data (e.g., 'data: move_forward')
   */
  async publishTopic(topic, msgType, data) {
    const cmd = `ros2 topic pub --once ${topic} ${msgType} '${data}'`;
    const result = await this._execInROS(cmd);
    if (result.success) {
      return { success: true, message: result.stdout };
    }
    return { success: false, error: result.error };
  }

  /**
   * Subscribe to a ROS topic (receive one message)
   * @param {string} topic - Topic name
   */
  async subscribeTopic(topic) {
    const cmd = `ros2 topic echo ${topic} --once`;
    const result = await this._execInROS(cmd);
    if (result.success) {
      return { success: true, data: result.stdout };
    }
    return { success: false, error: result.error };
  }

  /**
   * Call a ROS service
   * @param {string} service - Service name (e.g., '/robot_arm')
   * @param {string} srvType - Service type (e.g., 'std_srvs/Trigger')
   * @param {string} args - Service arguments (optional)
   */
  async callService(service, srvType, args = '') {
    const cmd = `ros2 service call ${service} ${srvType} ${args}`;
    const result = await this._execInROS(cmd);
    if (result.success) {
      return { success: true, response: result.stdout };
    }
    return { success: false, error: result.error };
  }

  /**
   * List all available topics
   */
  async listTopics() {
    const cmd = 'ros2 topic list';
    const result = await this._execInROS(cmd);
    if (result.success) {
      const topics = result.stdout.split('\n').filter(t => t.length > 0);
      return { success: true, topics };
    }
    return { success: false, error: result.error };
  }

  /**
   * List all available services
   */
  async listServices() {
    const cmd = 'ros2 service list';
    const result = await this._execInROS(cmd);
    if (result.success) {
      const services = result.stdout.split('\n').filter(s => s.length > 0);
      return { success: true, services };
    }
    return { success: false, error: result.error };
  }

  /**
   * Get topic information
   */
  async getTopicInfo(topic) {
    const cmd = `ros2 topic info ${topic}`;
    const result = await this._execInROS(cmd);
    if (result.success) {
      return { success: true, info: result.stdout };
    }
    return { success: false, error: result.error };
  }
}

module.exports = ROSTopicControl;

module.exports = ROSTopicControl;
