/**
 * PM2 cluster config — process management, auto-restart, log rotation
 */
module.exports = {
  apps: [
    {
      name: "zashly-api",
      script: "src/server.js",
      cwd: "./backend",
      instances: "max",
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
        TRUST_PROXY: "true",
      },
      max_memory_restart: "512M",
      error_file: "../logs/pm2-error.log",
      out_file: "../logs/pm2-out.log",
      merge_logs: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
