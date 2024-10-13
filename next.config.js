
module.exports = (phase, { defaultConfig }) => {
    return {
      ...defaultConfig,
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