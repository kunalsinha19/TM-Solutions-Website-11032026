module.exports = {
  apps: [
    {
      name: "tara-maa-frontend",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "tara-maa-backend",
      cwd: "./backend",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    }
  ]
};
