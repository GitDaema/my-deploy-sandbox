module.exports = {
  apps: [
    {
      name: 'deploy-sandbox-server',
      script: './server/app.js',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'deploy-sandbox-client',
      script: 'npm',
      args: 'run dev --workspace=client',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
