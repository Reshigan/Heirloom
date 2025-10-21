module.exports = {
  apps: [
    {
      name: 'loominary-backend',
      script: 'npx',
      args: 'tsx src/production-server.ts',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend.log',
      time: true
    },
    {
      name: 'loominary-frontend',
      script: 'npm',
      args: 'run preview -- --port 3000 --host 0.0.0.0',
      cwd: './sveltekit-app',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      max_memory_restart: '512M',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend.log',
      time: true
    }
  ]
};
