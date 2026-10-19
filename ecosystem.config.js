module.exports = {
    apps: [
      {
        name: "pos-uniform",
        script: ".next/standalone/server.js", // Standalone server: starts faster, needs no full node_modules
        cwd: __dirname, // Uses the folder this file lives in, no hardcoded path
        instances: 1, // A single local POS terminal doesn't need multi-core clustering
        exec_mode: "fork", // Lighter than cluster mode: one process, less RAM
        env: {
          NODE_ENV: "production",
          PORT: 3000,
          NEXT_TELEMETRY_DISABLED: "1",
        },
        watch: false, // Set to true if you want to auto-restart on changes
        autorestart: true, // Ensure app restarts on failure
        max_memory_restart: "1GB", // Restart if memory exceeds 512MB
        merge_logs: true, // Merge logs for better performance
        log_date_format: "YYYY-MM-DD HH:mm Z", // Better log readability
      },
    ],
  };
  