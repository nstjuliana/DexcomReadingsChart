const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const port = process.env.PORT; // Default port 3000
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;
const tls = Boolean(process.env.MONGODB_TLS) === false; // Use TLS if specified in environment variables

// Initialize MongoDB client globally and maintain persistent connection
let client;
let db;
let collection;

async function connectToMongoDB() {
    if (!client) {
        try {
            client = new MongoClient(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                tls: tls,
                serverSelectionTimeoutMS: 3000
            });

            await client.connect();
            db = client.db(dbName);
            collection = db.collection(collectionName);
            console.log("Connected to MongoDB");
        } catch (error) {
            console.error("MongoDB connection error:", error);
            throw new Error('Unable to connect to MongoDB');
        }
    }
}

app.use(express.static('public'));

// Endpoint to fetch data with an optional limit parameter
app.get('/api/data', async (req, res) => {
    try {
        // Ensure MongoDB is connected before querying
        await connectToMongoDB();

        // Parse and validate the limit parameter from query string
        const limit = parseInt(req.query.limit, 10) || 1000; // Default to 1000 if no limit is provided
        if (limit <= 0 || isNaN(limit)) {
            return res.status(400).json({ success: false, error: 'Invalid limit parameter' });
        }

        // Fetch the data from the database with the specified limit
        const data = await collection
            .find({})
            .limit(limit)
            .sort({ _datetime: -1 }) // Sort by datetime descending
            .project({ _value: 1, _datetime: 1, _id: 0 })
            .toArray();

        if (!data.length) {
            return res.status(404).json({ success: false, error: 'No data found' });
        }

        // Format the data and send it as a response
        const formattedData = data.reverse().map(item => ({
            _datetime: item._datetime instanceof Date ? item._datetime.toISOString() : new Date(item._datetime).toISOString(),
            _value: Number(item._value)
        }));

        res.json({ success: true, data: formattedData });

    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Error fetching data from MongoDB'
        });
    }
});

// Endpoint to check server status
app.get('/api/status', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

app.get('/config', (req, res) => {
  res.json({
    websiteName: process.env.WEBSITE_NAME || 'Dexcom Readings Chart',
    websiteDescription: process.env.WEBSITE_DESCRIPTION || ''
  });
});

// Start the server
async function startServer() {
    try {
        // Try to connect to MongoDB and then start the server
        await connectToMongoDB();
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    }
}

startServer();
