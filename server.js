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
const client = new MongoClient(uri);

app.get('/api/projects', async (req, res) => {
    try {
        await client.connect();
        const database = client.db("interia_studio");
        const collection = database.collection("projects");
        const projects = await collection.find({}).toArray();
        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/api/projects', async (req, res) => {
    console.log("Create project request received:", req.body.clientName, req.body.code);
    try {
        await client.connect();
        const database = client.db("interia_studio");
        const collection = database.collection("projects");
        const result = await collection.insertOne(req.body);
        console.log(`Project created successfully with _id: ${result.insertedId}`);
        res.status(201).json({ ...req.body, _id: result.insertedId });
    } catch (err) {
        console.error("Project creation error:", err);
        res.status(500).json({ error: "Failed to create project", details: err.message });
    }
});

app.put('/api/projects/:id', async (req, res) => {
    try {
        await client.connect();
        const database = client.db("interia_studio");
        const collection = database.collection("projects");
        const id = req.params.id;
        // Handle both integer IDs (from frontend) and MongoDB ObjectIDs if necessary
        // For now, let's assume we match on the 'id' field provided by the frontend
        const result = await collection.updateOne(
            { $or: [{ id: parseInt(id) }, { id: id }] },
            { $set: req.body }
        );
        res.json({ message: "Project updated", modifiedCount: result.modifiedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update project" });
    }
});

app.delete('/api/projects/bulk', async (req, res) => {
    console.log("Bulk delete request received for IDs:", req.body.ids);
    try {
        await client.connect();
        const database = client.db("interia_studio");
        const collection = database.collection("projects");
        const { ids } = req.body;

        // Convert IDs to numbers where possible to match both types
        const numericIds = ids.map(id => isNaN(id) ? id : parseInt(id));
        const combinedIds = [...new Set([...ids, ...numericIds])];

        const result = await collection.deleteMany({ id: { $in: combinedIds } });
        console.log(`Bulk delete successful. Deleted count: ${result.deletedCount}`);
        res.json({ message: "Projects deleted", deletedCount: result.deletedCount });
    } catch (err) {
        console.error("Bulk delete error:", err);
        res.status(500).json({ error: "Failed to delete projects", details: err.message });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    const id = req.params.id;
    console.log(`Single delete request received for ID: ${id}`);
    try {
        await client.connect();
        const database = client.db("interia_studio");
        const collection = database.collection("projects");

        const query = { $or: [{ id: parseInt(id) }, { id: id }, { id: String(id) }] };
        const result = await collection.deleteOne(query);

        console.log(`Delete attempt for ID ${id}. Deleted count: ${result.deletedCount}`);
        res.json({ message: "Project deleted", deletedCount: result.deletedCount });
    } catch (err) {
        console.error(`Delete error for ID ${id}:`, err);
        res.status(500).json({ error: "Failed to delete project", details: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
