# Job Logs Dashboard

A full-stack web application for analyzing and visualizing job log data, featuring a dashboard with filters, metrics, charts, and an AI chat assistant for job log analysis.

---

## Features

- **Dashboard**: Filter job logs by date, client, and country. View metrics, deltas, outliers, and trends.
- **Charts**: Visualize job statistics and trends using interactive charts.
- **AI Chat Assistant**: Ask questions about your job logs using natural language (powered by Groq's API).
- **Pagination & Sorting**: Easily navigate and sort large datasets.
- **Responsive UI**: Built with Material-UI and Recharts for a modern, mobile-friendly experience.

---

## Requirements

### For Docker (Recommended)
- **Docker Desktop** ([Download here](https://www.docker.com/products/docker-desktop))
- **Groq API Key** ([Get one here](https://console.groq.com/keys))

### For Local Development
- **Node.js** (v18+ recommended)
- **npm** (v9+ recommended)
- **MongoDB** (local instance required)
- **Groq API Key** ([Get one here](https://console.groq.com/keys))

---

## Quick Start with Docker 🐳 (Recommended)

The easiest way to run this application is with Docker. This method handles all dependencies automatically.

### 1. Clone the repository

```sh
git clone https://github.com/YOUR_USERNAME/job-logs-dashboard.git
cd job-logs-dashboard
```

### 2. Create Environment File

Create a `.env` file in the **project root** directory:

```
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Replace `your_groq_api_key_here` with your actual Groq API key ([get one here](https://console.groq.com/keys)).

### 3. Start All Services

```sh
docker-compose up -d
```

This command will:
- Build the frontend and backend Docker images
- Pull MongoDB image
- Start all three containers
- Set up networking between services

**First-time build takes 2-3 minutes. Subsequent starts are instant.**

### 4. Import Data (First Time Only)

```sh
docker-compose exec backend node scripts/importData.js
```

Wait for the import to complete (about 1-2 minutes).

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/health
- **MongoDB**: localhost:27017 (for database tools like MongoDB Compass)

### Docker Management Commands

```sh
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose up --build -d

# Stop and remove all data (fresh start)
docker-compose down -v
```

---

## Local Development Installation

### 1. Clone the repository

```sh
git clone https://github.com/YOUR_USERNAME/job-logs-dashboard.git
cd job-logs-dashboard
```

### 2. Set up and Activate Local MongoDB
**NOTE** 
- There is a remote database dedicated to this demo. If you wish to skip this step + the import of the data, please make sure you have this on the .env file:
```MONGODB_URI = mongodb+srv://liavcohen955:9GowzfHMcrR29NcW@cluster0.ppk3ago.mongodb.net```

This project is configured to work with a **local MongoDB instance only** by default.

- **Install MongoDB Community Edition:**
  [MongoDB Installation Guide](https://www.mongodb.com/docs/manual/installation/)

- **Start the MongoDB server:**
  ```sh
  mongod
  ```
  This launches the MongoDB server process on the default port (27017). **You must leave this running in a terminal window while using the app.**

- *(Optional)*: Open a MongoDB shell to inspect your database:
  ```sh
  mongosh
  ```
  or
  ```sh
  mongo
  ```
  This opens an interactive shell for manual inspection or debugging, but is **not required** to run the app.

### 3. Backend Setup

```sh
cd backend
npm install
```

#### Environment Variables

Create a `.env` file in the `backend/` directory:

```
MONGODB_URI=mongodb://localhost:27017/boston_assignment OR the remote address
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

- Replace `your_groq_api_key_here` with your actual Groq API key ([get one here](https://console.groq.com/keys)).
- The default `MONGODB_URI` is for local MongoDB only.
- `GROQ_MODEL` is optional and defaults to `llama-3.3-70b-versatile`. You can change this if the model gets deprecated. Common Groq models include: `llama-3.3-70b-versatile`, `llama-3.1-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, etc.

#### Import Data (REQUIRED)

Before running the backend, you **must** import the job log data into your local MongoDB:

```sh
node scripts/importData.js
```

Wait for the script to finish before continuing.

#### Start the Backend Server

```sh
npm start
```
The backend will run on `http://localhost:5000` by default.

### 4. Frontend Setup

Open a new terminal window/tab:

```sh
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173` by default.

---

## Usage

### With Docker
- Visit `http://localhost:3000` in your browser.
- Use the dashboard to filter, sort, and analyze job logs.
- Open the AI Chat Assistant page to ask questions about your job data.

### Local Development
- Visit `http://localhost:5173` in your browser.
- Use the dashboard to filter, sort, and analyze job logs.
- Open the AI Chat Assistant page to ask questions about your job data.

---

## Notes

- **API Key Security:** Never commit your `.env` file or API keys to version control.
- **Docker Recommended:** Using Docker is the easiest way to run the application as it handles all dependencies.
- **Data Persistence:** When using Docker, your MongoDB data persists in a Docker volume even after stopping containers.
- **Data Import:** You must run the import script before using the app (first time only).

---

## Project Structure

```
boston_assignment/
  backend/              # Express.js, MongoDB, API endpoints
    ├── Dockerfile      # Backend container configuration
    ├── .dockerignore   # Files to exclude from Docker build
    └── ...
  frontend/             # React, Vite, Material-UI, Recharts
    ├── Dockerfile      # Frontend container configuration
    ├── nginx.conf      # nginx web server configuration
    ├── .dockerignore   # Files to exclude from Docker build
    └── ...
  data/                 # Data files (e.g., transformedFeeds.json)
  docker-compose.yaml   # Multi-container orchestration
  .env                  # Environment variables (not committed)
```

---

## Architecture

### Docker Architecture

The application runs in three containers:

1. **Frontend Container** (nginx + React)
   - Serves static React files
   - Proxies `/api` requests to backend
   - Port: 3000 → 80

2. **Backend Container** (Node.js + Express)
   - REST API endpoints
   - Connects to MongoDB
   - Port: 5000

3. **MongoDB Container**
   - Database storage
   - Persistent data volume
   - Port: 27017

All containers communicate via a dedicated Docker network.

---

## Troubleshooting

### Docker Issues

**Port already in use:**
- Change the port mapping in `docker-compose.yaml`:
  ```yaml
  frontend:
    ports:
      - "3001:80"  # Changed from 3000
  ```

**Changes not reflecting:**
- Rebuild containers: `docker-compose up --build`

**Database is empty:**
- Run data import: `docker-compose exec backend node scripts/importData.js`

**Container won't start:**
- Check logs: `docker-compose logs -f [service-name]`
- Restart: `docker-compose restart [service-name]`

### Local Development Issues

**MongoDB connection error:**
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`

**Port conflicts:**
- Make sure ports 5000 (backend) and 5173 (frontend) are available

---

## License

MIT
