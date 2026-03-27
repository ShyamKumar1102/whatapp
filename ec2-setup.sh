#!/bin/bash

# ─────────────────────────────────────────
# EC2 Setup Script for WhatsApp CRM
# Run this on your EC2 instance after SSH
# ─────────────────────────────────────────

echo "🚀 Starting EC2 setup..."

# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Nginx
sudo apt install -y nginx

# 4. Install PM2
sudo npm install -g pm2

# 5. Install Git
sudo apt install -y git

# 6. Create app directory
sudo mkdir -p /var/www/whatsapp-crm
sudo chown -R $USER:$USER /var/www/whatsapp-crm

# 7. Clone your repo
cd /var/www/whatsapp-crm
git clone https://github.com/ShyamKumar1102/whatapp.git .

# 8. Install backend dependencies
cd /var/www/whatsapp-crm/backend
npm install

# 9. Copy production env (edit this file with your real values)
cp /var/www/whatsapp-crm/backend/.env.production /var/www/whatsapp-crm/backend/.env

# 10. Install frontend dependencies and build
cd /var/www/whatsapp-crm/frontend
npm install
npm run build

# 11. Setup Nginx config
sudo cp /var/www/whatsapp-crm/nginx.conf /etc/nginx/sites-available/whatsapp-crm
sudo ln -sf /etc/nginx/sites-available/whatsapp-crm /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
sudo systemctl enable nginx

# 12. Start backend with PM2
cd /var/www/whatsapp-crm
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | sudo bash

echo "✅ Setup complete!"
echo "🌐 Your site is live at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
