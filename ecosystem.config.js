module.exports = {
    apps: [
      {
        name: "pos",
        script: "node_modules/next/dist/bin/next",
        args: "start",
        cwd: "D:/Dd/MYSHOP/my-shop", // Change to your project directory
        instances: "max", // Uses all available CPU cores
        exec_mode:"cluster", // Enables clustering for high performance
        env: {
          NODE_ENV: "production",
          PORT: 3000,
        },
        watch: false, // Set to true if you want to auto-restart on changes
        autorestart: true, // Ensure app restarts on failure
        max_memory_restart: "1G", // Restart if memory exceeds 512MB
        merge_logs: true, // Merge logs for better performance
        log_date_format: "YYYY-MM-DD HH:mm Z", // Better log readability
        error_file: "/dev/null", // Disable error logs to reduce disk I/O
      },
    ],
  };
  