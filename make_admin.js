const { MongoClient } = require('mongodb');

async function run() {
  const uri = 'mongodb://Craft_Nest:4sxcRcAttiPEJ41Z@ac-kun0nzl-shard-00-00.7ye0vp5.mongodb.net:27017,ac-kun0nzl-shard-00-01.7ye0vp5.mongodb.net:27017,ac-kun0nzl-shard-00-02.7ye0vp5.mongodb.net:27017/?ssl=true&replicaSet=atlas-qqycj9-shard-0&authSource=admin&appName=Cluster0';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('Craft_Nest');
    
    // Set all to 'user' first
    await db.collection('users').updateMany({}, { $set: { role: 'user' } });
    
    // Set only Evana Anjum to 'admin'
    await db.collection('users').updateOne({ email: 'evanaanjum7@gmail.com' }, { $set: { role: 'admin' } });
    
    console.log("Roles fixed: Only Evana Anjum is admin, others are user.");
    
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
