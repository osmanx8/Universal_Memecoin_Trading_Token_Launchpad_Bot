const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bundler')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
  authKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  }
});

const User = mongoose.model('User', userSchema);

async function updateAdmin() {
  try {
    // Find the admin77 user
    const adminUser = await User.findOne({ authKey: 'admin77' });
    
    if (!adminUser) {
      console.log('admin77 user not found. Creating it...');
      const newAdmin = new User({
        authKey: 'admin77',
        isAdmin: true,
        isSuperAdmin: false
      });
      await newAdmin.save();
      console.log('Created admin77 user with admin privileges');
    } else {
      console.log('Found admin77 user, updating privileges...');
      adminUser.isAdmin = true;
      adminUser.isSuperAdmin = false;
      await adminUser.save();
      console.log('Updated admin77 user with admin privileges');
    }
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin:', error);
    process.exit(1);
  }
}

updateAdmin(); 