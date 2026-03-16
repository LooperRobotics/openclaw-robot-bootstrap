/**
 * ROS Topic Control Helper
 * Simplifies ROS 2 topic publishing and service calls from OpenClaw agents
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ROSTopicControl {
  constructor(options = {}) {
    this.domainId = options.domainId || process.env.ROS_DOMAIN_ID || '0';
    this.timeout = options.timeout || 5000;
    this.env = {
      ...process.env,
      ROS_DOMAIN_ID: this.domainId,
      ROS_LOCALHOST_ONLY: '0'
    };
  }

  /**
   * Publish a message to a ROS topic
   * @param {string} topic - Topic name (e.g., '/robot_cmd')
   * @param {string} msgType - Message type (e.g., 'std_msgs/String')
   * @param {string} data - Message data (e.g., 'data: move_forward')
   */
  async publishTopic(topic, msgType, data) {
    const cmd = `ros2 topic pub --once ${topic} ${msgType} '${data}'`;
    try {
      const { stdout } = await execAsync(cmd, {
        env: this.env,
        timeout: this.timeout
      });
      return { success: true, message: stdout.trim() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to a ROS topic (receive one message)
   * @param {string} topic - Topic name
   */
  async subscribeTopic(topic) {
    const cmd = `ros2 topic echo ${topic} --once`;
    try {
      const { stdout } = await execAsync(cmd, {
        env: this.env,
        timeout: this.timeout
      });
      return { success: true, data: stdout.trim() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Call a ROS service
   * @param {string} service - Service name (e.g., '/robot_arm')
   * @param {string} srvType - Service type (e.g., 'std_srvs/Trigger')
   * @param {string} args - Service arguments (optional)
   */
  async callService(service, srvType, args = '') {
    const cmd = `ros2 service call ${service} ${srvType} ${args}`;
    try {
      const { stdout } = await execAsync(cmd, {
        env: this.env,
        timeout: this.timeout
      });
      return { success: true, response: stdout.trim() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List all available topics
   */
  async listTopics() {
    const cmd = 'ros2 topic list';
    try {
      const { stdout } = await execAsync(cmd, {
        env: this.env,
        timeout: this.timeout
      });
      return { success: true, topics: stdout.trim().split('\n') };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List all available services
   */
  async listServices() {
    const cmd = 'ros2 service list';
    try {
      const { stdout } = await execAsync(cmd, {
        env: this.env,
        timeout: this.timeout
      });
      return { success: true, services: stdout.trim().split('\n') };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get topic information
   */
  async getTopicInfo(topic) {
    const cmd = `ros2 topic info ${topic}`;
    try {
      const { stdout } = await execAsync(cmd, {
        env: this.env,
        timeout: this.timeout
      });
      return { success: true, info: stdout.trim() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = ROSTopicControl;
