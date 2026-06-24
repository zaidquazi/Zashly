import mongoose from 'mongoose';
import 'dotenv/config';

async function checkUser() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");
  
  const user = await mongoose.connection.collection('users').findOne({ 
    $or: [
      { username: /zashly_user18/i },
      { usernameLowerCase: 'zashly_user18' }
    ]
  });
  
  if (user) {
    console.log("Found User:", {
      _id: user._id,
      username: user.username,
      usernameLowerCase: user.usernameLowerCase,
      email: user.email
    });
  } else {
    console.log("User 'zashly_user18' not found.");
  }
  
  await mongoose.disconnect();
}

checkUser().catch(console.error);
