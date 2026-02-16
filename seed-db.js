const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://sayednawaz2006_db_user:78xBA3bzR9xzKcfX@cluster0.chvkyar.mongodb.net/";
const client = new MongoClient(uri);

const projects = [
    {
        id: "1",
        clientName: "DK Residency Sankli Street",
        projectType: "Residential",
        location: "DK residency",
        budget: "₹85L",
        rating: 4.9,
        thumbnail: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80",
        details: "A premium luxury interior design project crafted with excellence and high-end materials.",
        status: "live",
        media: [{ type: "image", data: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80" }]
    },
    {
        id: "2",
        clientName: "Fortune Pearl Tower",
        projectType: "Residential",
        location: "Dongri , chawal gali",
        budget: "₹15L",
        rating: 4.7,
        thumbnail: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80",
        details: "Minimalist modern living space designed for comfort and elegance.",
        status: "live",
        media: [{ type: "image", data: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80" }]
    },
    {
        id: "3",
        clientName: "Skyline Heights",
        projectType: "Commercial",
        location: "Worli, Mumbai",
        budget: "₹2.5Cr",
        rating: 4.8,
        thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
        details: "State-of-the-art office interior with sustainable design elements.",
        status: "live",
        media: [{ type: "image", data: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80" }]
    },
    {
        id: "4",
        clientName: "Ocean View Villa",
        projectType: "Residential",
        location: "Alibaug",
        budget: "₹4.2Cr",
        rating: 5.0,
        thumbnail: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
        details: "Luxury beachfront villa with Mediterranean-inspired interiors.",
        status: "live",
        media: [{ type: "image", data: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80" }]
    },
    {
        id: "5",
        clientName: "The Grand Atrium",
        projectType: "Commercial",
        location: "BKC, Mumbai",
        budget: "₹5Cr",
        rating: 4.9,
        thumbnail: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80",
        details: "Corporate headquarters featuring premium materials and open-plan design.",
        status: "sold",
        media: [{ type: "image", data: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80" }]
    }
];

// Add 15 more placeholder projects to reach 20 as requested
for (let i = 6; i <= 20; i++) {
    projects.push({
        id: i.toString(),
        clientName: `Luxury Project ${i}`,
        projectType: i % 2 === 0 ? "Residential" : "Commercial",
        location: "South Mumbai",
        budget: `₹${(Math.random() * 5 + 0.5).toFixed(1)}Cr`,
        rating: (Math.random() * 0.5 + 4.5).toFixed(1),
        thumbnail: `https://images.unsplash.com/photo-${1616486000000 + i}?w=1200&q=80`,
        details: "Exquisite interior design project showcasing premium craftsmanship and attention to detail.",
        status: "live",
        media: [{ type: "image", data: `https://images.unsplash.com/photo-${1616486000000 + i}?w=1200&q=80` }]
    });
}

async function seed() {
    try {
        await client.connect();
        const database = client.db("interia_studio");
        const collection = database.collection("projects");

        // Clear existing
        await collection.deleteMany({});

        // Insert new
        const result = await collection.insertMany(projects);
        console.log(`${result.insertedCount} projects seeded successfully!`);
    } catch (err) {
        console.error("Error seeding database:", err);
    } finally {
        await client.close();
    }
}

seed();
