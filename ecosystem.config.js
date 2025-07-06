module.exports = {
  apps: [
    {
      name: "8ehradioitb", // Name shown in pm2 list
      script: "node_modules/.bin/next", // Executes Next.js
      args: "start -p 8000", // Start command with port, adjust if needed
      cwd: __dirname, // Current working directory = project root
      env: {
        NODE_ENV: "production",
        PORT: 8000,
      },
      // Log files
      error_file: "./logs/pm2/error.log",
      out_file: "./logs/pm2/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      // Auto-restart on crash / file change (should watch compiled build only)
      autorestart: true,
      // Wait before restart to avoid rapid restarts
      restart_delay: 5000,
    },
  ],
};
