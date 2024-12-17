module.exports = {
  apps: [
    {
      name: "Prize Rewards",
      script: "npm",
      args: "run dev",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
