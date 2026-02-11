/**
 * PM2 配置文件
 * 用于生产环境进程管理
 */

module.exports = {
  apps: [{
    name: 'fudaiai-backend',
    script: './server.js',

    // 实例配置
    instances: 1,
    exec_mode: 'fork',

    // 环境变量
    env_production: {
      NODE_ENV: 'production',
    },

    // 自动重启配置
    watch: false,
    max_memory_restart: '1G',

    // 日志配置
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,

    // 自动重启策略
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',

    // 启动延迟
    listen_timeout: 3000,
    kill_timeout: 5000,
  }]
};
