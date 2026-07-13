const { MongoClient } = require('mongodb');

async function run() {
  const uri = 'mongodb://Craft_Nest:4sxcRcAttiPEJ41Z@ac-kun0nzl-shard-00-00.7ye0vp5.mongodb.net:27017,ac-kun0nzl-shard-00-01.7ye0vp5.mongodb.net:27017,ac-kun0nzl-shard-00-02.7ye0vp5.mongodb.net:27017/?ssl=true&replicaSet=atlas-qqycj9-shard-0&authSource=admin&appName=Cluster0';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('Craft_Nest');
    const itemsCol = db.collection('items');
    const categoriesCol = db.collection('categories');
    
    const categories = [
      { name: "Ceramics", description: "Hand-thrown pottery and kilned clay works", image: "/images/seed/ceramic-bowl.png", createdAt: new Date(), updatedAt: new Date() },
      { name: "Woodworking", description: "Solid wood furniture and carved art", image: "/images/seed/oak-table.png", createdAt: new Date(), updatedAt: new Date() },
      { name: "Leather Goods", description: "Hand-stitched leather apparel and accessories", image: "/images/seed/leather-bag.png", createdAt: new Date(), updatedAt: new Date() },
      { name: "Jewelry", description: "Custom forged metals and stones", image: "/images/seed/earrings.png", createdAt: new Date(), updatedAt: new Date() },
      { name: "Textiles", description: "Woven fabrics and hand-dyed yarns", image: "/images/seed/scarf.png", createdAt: new Date(), updatedAt: new Date() },
      { name: "Glass Art", description: "Blown glass and stained glass decor", image: "/images/seed/glass-pendant.png", createdAt: new Date(), updatedAt: new Date() }
    ];
    await categoriesCol.deleteMany({});
    await categoriesCol.insertMany(categories);
    console.log("Seeded categories!");
    
    await itemsCol.updateOne({ title: 'Rustic Wooden Bowl' }, { $set: { category: 'Woodworking', images: ['/images/seed/wooden-bowl.png'] } });
    await itemsCol.updateOne({ title: 'Woven Cotton Throw Blanket' }, { $set: { images: ['/images/seed/cotton-blanket.png'] } });
    await itemsCol.updateOne({ title: 'Handcrafted Ceramic Vase' }, { $set: { images: ['/images/seed/ceramic-vase.png'] } });
    await itemsCol.updateOne({ title: 'Silver Artisan Necklace' }, { $set: { images: ['/images/seed/artisan-necklace.png'] } });
    
    // Get a user id
    const user = await db.collection('users').findOne({});
    if (!user) {
      console.log("No user found to use as ownerId");
      return;
    }
    const ownerId = user._id;

    // Remove old seeded items if they exist (to avoid duplicates if run multiple times)
    await itemsCol.deleteMany({ title: { $regex: 'Seeded' } });

    const newItems = [
      {
        ownerId, title: 'Handcrafted Oak Table (Seeded)', shortDescription: 'Solid oak dining table for 6.', fullDescription: 'Beautiful handcrafted solid oak dining table...', price: 450, category: 'Woodworking', images: ['/images/seed/oak-table.png'], quantity: 2, location: 'Seattle, WA', avgRating: 4.8, reviewCount: 5, status: 'approved', createdAt: new Date(), updatedAt: new Date()
      },
      {
        ownerId, title: 'Leather Crossbody Bag (Seeded)', shortDescription: 'Genuine leather crossbody bag.', fullDescription: 'Stitched entirely by hand using premium leather.', price: 120, category: 'Leather Goods', images: ['/images/seed/leather-bag.png'], quantity: 15, location: 'Austin, TX', avgRating: 5.0, reviewCount: 12, status: 'approved', createdAt: new Date(), updatedAt: new Date()
      },
      {
        ownerId, title: 'Blown Glass Pendant (Seeded)', shortDescription: 'Unique blown glass light pendant.', fullDescription: 'Hand-blown glass pendant for modern lighting.', price: 210, category: 'Glass Art', images: ['/images/seed/glass-pendant.png'], quantity: 8, location: 'Portland, OR', avgRating: 4.5, reviewCount: 8, status: 'approved', createdAt: new Date(), updatedAt: new Date()
      },
      {
        ownerId, title: 'Ceramic Serving Bowl (Seeded)', shortDescription: 'Large ceramic serving bowl.', fullDescription: 'Perfect for salads or pasta. Dishwasher safe.', price: 65, category: 'Ceramics', images: ['/images/seed/ceramic-bowl.png'], quantity: 10, location: 'New York, NY', avgRating: 4.2, reviewCount: 3, status: 'approved', createdAt: new Date(), updatedAt: new Date()
      },
      {
        ownerId, title: 'Silver Pearl Earrings (Seeded)', shortDescription: 'Sterling silver and freshwater pearl.', fullDescription: 'Elegant drop earrings for any occasion.', price: 95, category: 'Jewelry', images: ['/images/seed/earrings.png'], quantity: 20, location: 'Chicago, IL', avgRating: 4.9, reviewCount: 22, status: 'approved', createdAt: new Date(), updatedAt: new Date()
      },
      {
        ownerId, title: 'Hand-Dyed Scarf (Seeded)', shortDescription: 'Silk scarf with indigo dye.', fullDescription: 'Luxurious silk scarf hand-dyed using traditional methods.', price: 45, category: 'Textiles', images: ['/images/seed/scarf.png'], quantity: 30, location: 'Denver, CO', avgRating: 4.0, reviewCount: 1, status: 'approved', createdAt: new Date(), updatedAt: new Date()
      },
      {
        ownerId, title: 'Carved Walnut Box (Seeded)', shortDescription: 'Intricately carved wooden keepsake box.', fullDescription: 'Made from sustainably sourced walnut wood.', price: 75, category: 'Woodworking', images: ['/images/seed/walnut-box.png'], quantity: 5, location: 'Seattle, WA', avgRating: 4.7, reviewCount: 6, status: 'approved', createdAt: new Date(), updatedAt: new Date()
      },
      {
        ownerId, title: 'Leather Wallet (Seeded)', shortDescription: 'Minimalist leather cardholder.', fullDescription: 'Slim design holding up to 8 cards.', price: 35, category: 'Leather Goods', images: ['/images/seed/leather-wallet.png'], quantity: 50, location: 'Austin, TX', avgRating: 4.6, reviewCount: 18, status: 'approved', createdAt: new Date(), updatedAt: new Date()
      }
    ];

    await itemsCol.insertMany(newItems);
    console.log("Successfully seeded more items and fixed existing images!");

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
run();
