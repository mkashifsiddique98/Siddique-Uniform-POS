
module.exports = (phase, { defaultConfig }) => {
    return {
      ...defaultConfig,
      // swcMinify: true, // Enable SWC for faster minification
      compiler: {
      removeConsole: process.env.NODE_ENV === "production",
      },
      eslint:{
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
          }
        }
        return config
      },
    }
  }