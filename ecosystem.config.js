module.exports = {
  apps: [
    {
      name: "sandbox-server",
      script: "./server/index.js",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
