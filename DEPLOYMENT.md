# Deployment Guide

## Overview

Dayflow HRMS can be deployed to Vercel (recommended), AWS, Google Cloud, or any Node.js hosting platform.

## Vercel Deployment (Recommended)

### Prerequisites
- Vercel account ([vercel.com](https://vercel.com))
- GitHub repository
- MongoDB Atlas cluster (or self-hosted MongoDB)

### Step 1: Prepare MongoDB

If using MongoDB Atlas:

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with a strong password
3. Add your deployment IP to the IP whitelist
4. Copy the connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)

### Step 2: Push Code to GitHub

```bash
git add .
git commit -m "Initial commit: Dayflow HRMS"
git push origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Continue with GitHub"
3. Select your repository
4. Configure project:
   - Framework: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next

5. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/hrms
   MONGODB_DB_NAME=hrms
   JWT_SECRET=generate_a_random_string_here
   ```

6. Click "Deploy"

7. Initialize database:
   ```bash
   npm run db:init
   ```

### Step 4: Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records with Vercel's nameservers

## AWS Deployment

### Using EC2

1. **Launch EC2 Instance**
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: t3.micro (free tier) or t3.small
   - Security Group: Allow ports 80, 443, 3000

2. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm
   ```

3. **Clone Repository**
   ```bash
   git clone your-repo-url
   cd dayflow-hrms
   npm install
   ```

4. **Setup Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with production values
   ```

5. **Build and Start**
   ```bash
   npm run build
   npm start
   ```

6. **Setup PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   pm2 start npm --name "hrms" -- start
   pm2 startup
   pm2 save
   ```

7. **Setup Nginx Reverse Proxy**
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

8. **Setup SSL Certificate**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Using Elastic Beanstalk

1. Install EB CLI: `pip install awsebcli`
2. Initialize: `eb init -p node.js-20 hrms`
3. Create environment: `eb create hrms-prod`
4. Deploy: `eb deploy`
5. Configure environment variables in EB Console

## Google Cloud Deployment

### Using Cloud Run

1. **Build Docker Image**
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Push to Container Registry**
   ```bash
   gcloud builds submit --tag gcr.io/project-id/hrms
   ```

3. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy hrms \
     --image gcr.io/project-id/hrms \
     --platform managed \
     --region us-central1 \
     --set-env-vars MONGODB_URI=$MONGODB_URI
   ```

## Database Backups

### MongoDB Atlas Automatic Backups
- Go to Atlas Console
- Cluster → Backup
- Enable automatic backups (default: daily)

### Manual Backup
```bash
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/hrms" --out ./backups
```

## Monitoring & Logging

### Vercel
- Metrics: vercel.com → Project → Analytics
- Logs: vercel.com → Project → Logs

### AWS CloudWatch
```bash
aws logs tail /aws/lambda/hrms --follow
```

### Google Cloud Logging
```bash
gcloud logging read "resource.type=cloud_run_revision"
```

## Performance Optimization

### Frontend
- Image optimization (Next.js automatic)
- Code splitting (Next.js automatic)
- CSS minification (Tailwind automatic)

### Backend
- Database indexing (configured in db-schema.ts)
- Connection pooling (MongoDB connection caching)
- Response caching (implement as needed)

### Monitoring
- Use Vercel Analytics for frontend metrics
- Monitor database query performance
- Set up alerts for error rates

## Security Checklist

- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Rate limit API endpoints
- [ ] Enable database authentication
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Enable database encryption
- [ ] Setup backup strategy

## Rollback Procedure

### Vercel
1. Go to Deployments
2. Find previous stable deployment
3. Click the three dots → Promote to Production

### AWS
1. Go to CodeDeploy or Elastic Beanstalk
2. Select previous successful revision
3. Click "Deploy now"

## Troubleshooting

### Deployment Fails
- Check logs: `npm run build` locally
- Verify all environment variables are set
- Clear cache: `npm cache clean --force`

### Database Connection Issues
- Verify MongoDB connection string
- Check IP whitelist in MongoDB Atlas
- Test connection: `mongo "mongodb+srv://..."`

### Performance Issues
- Monitor database query performance
- Check API response times
- Review and optimize slow queries
