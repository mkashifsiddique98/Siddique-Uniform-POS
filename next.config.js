module.exports = (phase, { defaultConfig }) => {
  return {
    ...defaultConfig,
    // Enable proxying requests from /bridge/* to your local backend on port 8080
    async rewrites() {
      return [
        {
          source: '/bridge/:path*',
          destination: 'http://localhost:8080/:path*',
        },
      ];
    },
    compiler: {
      removeConsole: process.env.NODE_ENV === "production",
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    webpack: (config) => {
      config.resolve = {
        ...config.resolve,
        fallback: {
          "fs": false,
          "path": false,
          "os": false,
        },
      };
      return config;
    },
  };
};