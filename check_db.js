const mongoose = require('./node_modules/mongoose');
const URI = 'mongodb://localhost:27017/coding-club';

async function check() {
  try {
    await mongoose.connect(URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    if (collections.some(c => c.name === 'users')) {
       const indexes = await mongoose.connection.db.collection('users').indexes();
       console.log('User Indexes:', JSON.stringify(indexes, null, 2));
    } else {
       console.log('No users collection found');
    }
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
