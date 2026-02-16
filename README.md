# Wordle IPRO

[**Live Demo**](https://wordle-fb.duckdns.org)



A modern, responsive Wordle clone built with Angular and a robust backend. This project serves as a showcase of full-stack web development skills developed for the **IPRO module at FHNW** (University of Applied Sciences and Arts Northwestern Switzerland).

## 🚀 Project Overview

This repository contains the source code for the **Wordle IPRO** project. The application replicates the popular word-guessing game mechanics while adding persistent user statistics, a polished UI, and backend integration.

## 🛠 Tech Stack

### Frontend
- **Framework**: Angular (Latest)
- **Styling**: SCSS, Bootstrap 5, ng-bootstrap (Responsive & Modern Design)
- **State Management**: Angular Signals

### Backend
- **Runtime**: .NET 10 (ASP.NET Core Web API)
- **Framework**: [Kull.GenericBackend](https://github.com/Kull-AG/kull-generic-backend) for rapid API development
- **Database**: SQL Server (via `Microsoft.Data.SqlClient`)
- **API Documentation**: Swagger/OpenAPI (via Swashbuckle)
- **Authentication**: None (Guest Mode only)

## 📂 Project Structure

```bash
wordle_ipro/
├── .github/workflows/    # GitHub Actions CI/CD
│   └── deploy.yml        # Automatic deployment workflow
├── wordle-frontend/      # Angular frontend application
│   ├── Dockerfile        # Multi-stage build for Angular + Nginx
│   └── nginx.conf        # Nginx config (serves app & proxies API)
├── wordle-backend/       # .NET Web API backend
│   └── Dockerfile        # Multi-stage build for .NET 10
├── docker-compose.yml    # Container orchestration
├── DESIGN_PATTERNS.md    # Software architecture patterns
├── GAME_RULES.md         # How to play Wordle
├── IPRO_NACHWEIS.md      # Competence proof for IPRO module
├── MILESTONES.md         # Project roadmap and deadlines
├── PROCESS.md            # Development process & decisions
└── README.md             # This file
```

## 🚦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)
- Angular CLI (`npm install -g @angular/cli`)

### Running Locally (Hybrid Mode)

For development, you can run the frontend and backend locally while connecting to the production database via an SSH tunnel.

1. **Setup**:
   ```bash
   cd wordle-frontend
   npm install
   ```

2. **Establish Database Tunnel** (Keep this terminal open):
   ```bash
   npm run ssh-db-tunnel
   ```
   > This forwards local port 1433 to the production database.

3. **Start the Backend** (In a new terminal, inside `wordle-frontend`):
   ```bash
   npm run run-backend
   ```
   > Starts the .NET API on `http://localhost:5031`.

4. **Start the Frontend** (In a new terminal, inside `wordle-frontend`):
   ```bash
   npm start
   ```

5. Open your browser at `http://localhost:4200`.

## 🐳 Deployment (Docker & VM)

### Prerequisites
- A Linux VM (e.g., Debian 13) with Docker installed
- UFW firewall configured to allow ports 80/443 (HTTP/HTTPS) and 22 (SSH)
- GitHub repository secrets configured: `HOST`, `USERNAME`, `KEY`, `DB_PASSWORD`
- **Domain**: Pointed to the VM's IP (e.g., `wordle-fb.duckdns.org`)
- **SSL Certificates**: Generated via Certbot directly on the host machine at `/etc/letsencrypt`


### Architecture
The application runs as a containerized stack orchestrated by Docker Compose:

| Service | Container | Description |
|---------|-----------|-------------|
| **Frontend** | `wordle-ui` | Angular app served via Nginx on port 80 & 443 (SSL) |
| **Backend** | `wordle-api` | .NET 10 API on internal port 8080 |
| **Database** | `wordle-db` | SQL Server Express 2022 |

### Running with Docker Compose (Local)

1. Create a `.env` file in the root directory:
   ```bash
   DB_PASSWORD=YourSecurePassword123!
   ```

2. Build and start the containers:
   ```bash
   docker compose up -d --build
   ```

3. Access the application at `http://localhost`

> **Note**: The `docker-compose.yml` mounts SSL certificates from `/etc/letsencrypt` on the host. If running locally on Windows/Mac without these files, you may need to comment out the volume mount and the 443 server block in `nginx.conf` or map local dummy certificates.


### Automatic Deployment (GitHub Actions)

On every push to `main`, the workflow in `.github/workflows/deploy.yml` will:
1. SSH into the production VM
2. Pull the latest code
3. Rebuild and restart containers via `docker compose`

## 📅 Milestones

I am tracking my progress using a detailed roadmap.
Check out [MILESTONES.md](./MILESTONES.md) to see the current status, upcoming deadlines, and completed tasks.

## 🤝 Context

This is an individual student project for the **IPRO module** at FHNW.

