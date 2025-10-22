# Tophill Portal Deployment Guide

## Prerequisites
- MySQL 8.0+
- Node.js 16+
- npm 8+

## Environment Setup
1. Copy `.env.example` to `.env`
2. Configure database credentials
3. Set JWT secret

## Database Setup
```bash
mysql -u root -p < php/schema/mysql-schema.sql
mysql -u root -p < api/schema/feeds-notifications.sql
```

## Application Start
```bash
cd api
npm install
npm start
```

## Verification
- Health check: http://localhost:3000/api/health
- API docs: http://localhost:3000/api-docs (if Swagger is added)