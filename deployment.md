# Deployment Instructions

## Render.com (Recommended for Cloud Hosting)

1.  **Push your code to GitHub/GitLab**.
2.  **Create a Web Service**:
    -   Go to [dashboard.render.com](https://dashboard.render.com).
    -   Click **New +** -> **Web Service**.
    -   Connect your repository.
3.  **Configure**:
    -   **Runtime**: Node
    -   **Build Command**: `npm install`
    -   **Start Command**: `node server.js`
4.  **Environment Variables**:
    -   Add `MONGODB_URI`: Your MongoDB connection string.
    -   `PORT` is automatically handled by Render (usually defaults to 10000), but `server.js` is already set up to listen on `process.env.PORT`.

Alternatively, you can use the `render.yaml` Blueprint specification if you prefer Infrastructure as Code.

---

## Docker Deployment

### Prerequisites
- **Docker Desktop** must be installed AND **running**.

### Running with Docker Compose

1.  **Start Docker Desktop**.
2.  **Build and Start**:
    ```bash
    docker-compose up --build -d
    ```
3.  **Verify**:
    Open your browser and navigate to `http://localhost:3000` (or `http://localhost:8083` if you changed the port).

4.  **Stop**:
    ```bash
    docker-compose down
    ```

### Troubleshooting
-   **"Failed to connect to the docker API"**: Ensure Docker Desktop is running.
-   **"Offline: Unable to connect to MongoDB"**: Ensure your frontend is using relative paths (e.g., `/api/projects`) and your `MONGODB_URI` environment variable is correct if you are overriding it.
