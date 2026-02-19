require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration (Needed for server-side deletion)
if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn("WARNING: Cloudinary API Key or Secret is missing. Image deletion will NOT work.");
    console.log("Please set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your environment.");
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dv1ahqkjo',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper to extract public_id from Cloudinary URL
function getPublicIdFromUrl(url) {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return null;

        let pathParts = parts.slice(uploadIndex + 1);
        // Skip version string if present (e.g., v1740039239)
        if (pathParts.length > 0 && pathParts[0].startsWith('v') && /^\d+$/.test(pathParts[0].substring(1))) {
            pathParts = pathParts.slice(1);
        }

        // join remaining and remove extension
        return pathParts.join('/').split('.')[0];
    } catch (e) {
        return null;
    }
}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname, { extensions: ['html'] }));

const uri = process.env.MONGODB_URI || "mongodb+srv://sayednawaz2006_db_user:78xBA3bzR9xzKcfX@cluster0.chvkyar.mongodb.net/excellence_studio?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
});

let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("excellence_studio");
        console.log("Successfully connected to MongoDB Atlas");
    } catch (err) {
        console.error("Critical: Could not connect to MongoDB Atlas", err);
        process.exit(1);
    }
}

// Routes
app.get('/api/projects', async (req, res) => {
    try {
        const collection = db.collection("projects");
        const projects = await collection.find({}).toArray();
        res.json(projects);
    } catch (err) {
        console.error("GET /api/projects error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/api/projects', async (req, res) => {
    console.log("Create project request received:", req.body.clientName);
    try {
        const collection = db.collection("projects");
        const projectData = {
            ...req.body,
            createdAt: new Date() // Add timestamp for 2-month auto-cleanup
        };
        const result = await collection.insertOne(projectData);
        console.log(`Project created successfully with _id: ${result.insertedId}`);
        res.status(201).json({ ...projectData, _id: result.insertedId });
    } catch (err) {
        console.error("POST /api/projects error:", err);
        res.status(500).json({ error: "Failed to create project", details: err.message });
    }
});

app.put('/api/projects/:id', async (req, res) => {
    try {
        const collection = db.collection("projects");
        const id = req.params.id;
        const result = await collection.updateOne(
            { $or: [{ id: parseInt(id) }, { id: id }, { id: String(id) }] },
            { $set: req.body }
        );
        res.json({ message: "Project updated", modifiedCount: result.modifiedCount });
    } catch (err) {
        console.error("PUT /api/projects error:", err);
        res.status(500).json({ error: "Failed to update project" });
    }
});

app.delete('/api/projects/bulk', async (req, res) => {
    try {
        const collection = db.collection("projects");
        const { ids } = req.body;
        const numericIds = ids.map(id => isNaN(id) ? id : parseInt(id));
        const combinedIds = [...new Set([...ids, ...numericIds])];

        // 1. Find projects to cleanup Cloudinary images
        const projects = await collection.find({ id: { $in: combinedIds } }).toArray();
        const publicIds = [];

        projects.forEach(project => {
            const publicPath = getPublicIdFromUrl(project.thumbnail);
            if (publicPath) publicIds.push(publicPath);
        });

        if (publicIds.length > 0) {
            try {
                await cloudinary.api.delete_resources(publicIds);
            } catch (cloudErr) {
                console.error("Cloudinary Bulk Delete Error:", cloudErr.message);
            }
        }

        const result = await collection.deleteMany({ id: { $in: combinedIds } });
        res.json({ message: "Projects deleted", deletedCount: result.deletedCount });
    } catch (err) {
        console.error("DELETE /api/projects/bulk error:", err);
        res.status(500).json({ error: "Failed to delete projects" });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const collection = db.collection("projects");
        const query = { $or: [{ id: parseInt(id) }, { id: id }, { id: String(id) }] };

        // 1. Find the project to get the thumbnail URL
        const project = await collection.findOne(query);

        if (project && project.thumbnail) {
            const publicPath = getPublicIdFromUrl(project.thumbnail);
            if (publicPath) {
                try {
                    await cloudinary.uploader.destroy(publicPath);
                } catch (cloudErr) {
                    console.error("Cloudinary Delete Error:", cloudErr.message);
                }
            }
        }

        const result = await collection.deleteOne(query);
        res.json({ message: "Project deleted", deletedCount: result.deletedCount });
    } catch (err) {
        console.error(`DELETE /api/projects/${id} error:`, err);
        res.status(500).json({ error: "Failed to delete project" });
    }
});

// 404 handler for API routes (Commented out temporarily to fix Express 5 crash)
// app.all('/api/(.*)', (req, res) => {
//     res.status(404).json({ error: "API Route not found" });
// });

// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    res.status(err.status || 500).json({
        error: "Server Error",
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 2-Month Auto-Cleanup Logic
async function cleanupExpiredProjects() {
    console.log("Running scheduled cleanup for projects older than 2 months...");
    try {
        const collection = db.collection("projects");
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

        // Find projects older than 60 days
        const expiredProjects = await collection.find({
            createdAt: { $lt: twoMonthsAgo }
        }).toArray();

        if (expiredProjects.length === 0) {
            console.log("No expired projects found.");
            return;
        }

        console.log(`Found ${expiredProjects.length} expired projects. Cleaning up resources...`);

        const publicIds = [];
        const dbIds = [];

        expiredProjects.forEach(project => {
            dbIds.push(project.id);
            const publicPath = getPublicIdFromUrl(project.thumbnail);
            if (publicPath) publicIds.push(publicPath);
        });

        // 1. Delete from Cloudinary
        if (publicIds.length > 0) {
            try {
                await cloudinary.api.delete_resources(publicIds);
                console.log(`Deleted ${publicIds.length} images from Cloudinary.`);
            } catch (cloudErr) {
                console.error("Cloudinary Cleanup Error:", cloudErr.message);
            }
        }

        // 2. Delete from MongoDB
        const result = await collection.deleteMany({
            id: { $in: dbIds }
        });
        console.log(`Successfully removed ${result.deletedCount} expired projects from database.`);

    } catch (err) {
        console.error("Cleanup Job Error:", err);
    }
}

// Start server
async function startServer() {
    try {
        await connectDB();

        // Run cleanup on startup and then every 24 hours
        cleanupExpiredProjects();
        setInterval(cleanupExpiredProjects, 24 * 60 * 60 * 1000);

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
            console.log(`To view projects, open: http://localhost:${port}/index`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
    }
}

startServer();
