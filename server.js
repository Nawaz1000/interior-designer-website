const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname));

const uri = process.env.MONGODB_URI || "mongodb+srv://sayednawaz2006_db_user:78xBA3bzR9xzKcfX@cluster0.chvkyar.mongodb.net/interia_studio?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
});

let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("interia_studio");
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
        const result = await collection.insertOne(req.body);
        console.log(`Project created successfully with _id: ${result.insertedId}`);
        res.status(201).json({ ...req.body, _id: result.insertedId });
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
        const result = await collection.deleteOne(query);
        res.json({ message: "Project deleted", deletedCount: result.deletedCount });
    } catch (err) {
        console.error(`DELETE /api/projects/${id} error:`, err);
        res.status(500).json({ error: "Failed to delete project" });
    }
});

// Start server
async function startServer() {
    await connectDB();
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log(`To view projects, open: http://localhost:${port}/index.html`);
    });
}

startServer();
