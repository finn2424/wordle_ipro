# Wordle IPRO

A modern, responsive Wordle clone built with Angular and a robust backend. This project serves as a showcase of full-stack web development skills developed for the **IPRO module at FHNW** (University of Applied Sciences and Arts Northwestern Switzerland).

## 🚀 Project Overview

This repository contains the source code for the **Wordle IPRO** project. The application replicates the popular word-guessing game mechanics while adding persistent user statistics, a polished UI, and backend integration.

## 🛠 Tech Stack

### Frontend
- **Framework**: Angular (Latest)
- **Styling**: SCSS / Vanilla CSS (Responsive & Modern Design)
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
├── wordle-frontend/      # Angular frontend application
├── wordle-backend/       # .NET Web API backend
├── MILESTONES.md         # Project roadmap and deadlines
├── PROCESS.md            # Development process & decisions
└── README.md             # This file
```

## 🚦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)
- Angular CLI (`npm install -g @angular/cli`)

### Running the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd wordle-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser at `http://localhost:4200`

## 📅 Milestones

I am tracking my progress using a detailed roadmap.
Check out [MILESTONES.md](./MILESTONES.md) to see the current status, upcoming deadlines, and completed tasks.

## 🤝 Context

This is an individual student project for the **IPRO module** at FHNW.

