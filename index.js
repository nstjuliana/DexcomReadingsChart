const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://nstj:as1111@cluster0.xa8tgku.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  tls: true,
  serverSelectionTimeoutMS: 3000,
  autoSelectFamily: false,
});

async function connectToDatabase() {
    try {
        client = await client.connect(uri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        // Fetch data and sort by datetime
        const data = await collection
            .find({})
            .sort({ _datetime: 1 })
            .project({ _value: 1, _datetime: 1, _id: 0 })
            .toArray()
            .limit(100);

        // Log all values and datetimes
        console.log('Retrieved data from MongoDB:');
        data.forEach((item, index) => {
            console.log(`Record ${index + 1}:`);
            console.log(`  _datetime: ${new Date(item._datetime).toISOString()}`);
            console.log(`  _value: ${item._value}`);
        });
        console.log(`Total records: ${data.length}`);
            
        await client.close();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

connectToDatabase();