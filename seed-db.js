const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://sayednawaz2006_db_user:78xBA3bzR9xzKcfX@cluster0.chvkyar.mongodb.net/";
const client = new MongoClient(uri);

// Pool of valid Unsplash luxury interior images
const imagePool = [
    "1616486333803-29e5a420f67e",
    "1618221195710-dd6b41faaea6",
    "1615874959474-d609969a20ed",
    "1631675591470-4e5b72f7be62",
    "1616137466211-f939a420be84",
    "1600210492493-0946911123ea",
    "1616486701797-0f33f61038ec",
    "1615529328331-f8917597711f",
    "1618219908412-a29a1bb7b86e",
    "1616046229478-9901c5536a45",
    "1616486338812-3dadae4b4ace",
    "1497366216548-37526070297c",
    "1613490493576-7fde63acd811",
    "1497366811353-6870744d04b2",
    "1600607687920-4e2a12cf6a58",
    "1600607687644-c7171b42498f",
    "1600585154340-be6161a56a0c",
    "1600585153490-75f1f1d287a2",
    "1600566753190-17811886722d",
    "1600566753086-00f18fb6326c"
];

const projects = [];

// Generate 50 unique projects
for (let i = 1; i <= 50; i++) {
    const imageId = imagePool[i % imagePool.length];
    const imageUrl = `https://images.unsplash.com/photo-${imageId}?w=1200&q=80`;

    projects.push({
        id: i.toString(),
        clientName: i <= 5 ? [
            "DK Residency Sankli Street",
            "Fortune Pearl Tower",
            "Skyline Heights",
            "Ocean View Villa",
            "The Grand Atrium"
        ][i - 1] : `Luxury Residence ${i}`,
        projectType: i % 3 === 0 ? "Commercial" : "Residential",
        location: i <= 5 ? [
            "DK residency",
            "Dongri, chawal gali",
            "Worli, Mumbai",
            "Alibaug",
            "BKC, Mumbai"
        ][i - 1] : (i % 2 === 0 ? "South Mumbai" : "Bandra, Mumbai"),
        budget: i <= 5 ? ["₹85L", "₹15L", "₹2.5Cr", "₹4.2Cr", "₹5Cr"][i - 1] : `₹${(Math.random() * 2 + 0.5).toFixed(1)}Cr`,
        rating: (Math.random() * 0.5 + 4.5).toFixed(1),
        thumbnail: imageUrl,
        details: "Exquisite interior design project showcasing premium craftsmanship and attention to detail. This project features high-end materials and custom furniture.",
        status: i % 7 === 0 ? "sold" : "live",
        media: [{ type: "image", data: imageUrl }],
        instagramUrl: "https://www.instagram.com/homesbyexcellence"
    });
}

async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await client.connect();
        const database = client.db("excellence_studio");
        const collection = database.collection("projects");

        console.log("Clearing existing projects...");
        await collection.deleteMany({});

        console.log(`Inserting ${projects.length} projects...`);
        const result = await collection.insertMany(projects);
        console.log(`${result.insertedCount} projects seeded successfully!`);
    } catch (err) {
        console.error("Error seeding database:", err);
    } finally {
        await client.close();
        process.exit();
    }
}

seed();
