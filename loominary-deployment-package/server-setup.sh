#!/bin/bash

echo "🖥️ LOOMINARY SERVER SETUP"
echo "========================="

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2
sudo npm install -g pm2

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

echo "✅ Server setup completed!"
echo "📋 Next: Run ./quick-deploy.sh to deploy Loominary"
