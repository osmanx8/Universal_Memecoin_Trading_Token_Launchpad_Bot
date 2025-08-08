import { User, IUser } from './user';

// Generate a new auth key string
const generateAuthKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};



export const createAuthKey = async (): Promise<string> => {
  try {
    // Generate unique auth key
    let authKey: string;
    let existingUser;
    
    do {
      authKey = generateAuthKey();
      existingUser = await User.findOne({ authKey });
    } while (existingUser);

    // Create new user
    const user = new User({
      authKey
    });

    await user.save();

    console.log(`Auth key created: ${authKey}`);
    console.log(`User details:`, {
      id: user._id,
      createdAt: user.createdAt
    });

    return authKey;
  } catch (error) {
    console.error('Error creating auth key:', error);
    throw error;
  }
};

export const createAdminKey = async (): Promise<string> => {
  try {
    // Generate unique auth key
    let authKey: string;
    let existingUser;
    
    do {
      authKey = generateAuthKey();
      existingUser = await User.findOne({ authKey });
    } while (existingUser);

    // Create new admin user
    const user = new User({
      authKey,
      isAdmin: true,
      isSuperAdmin: false
    });

    await user.save();

    console.log(`Admin key created: ${authKey}`);
    console.log(`Admin user details:`, {
      id: user._id,
      createdAt: user.createdAt
    });

    return authKey;
  } catch (error) {
    console.error('Error creating admin key:', error);
    throw error;
  }
};



export const listUsers = async (): Promise<void> => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    
    console.log('\nUser List:');
    console.log('─'.repeat(80));
    
    users.forEach((user: IUser, index: number) => {
      console.log(`${index + 1}. ID: ${user._id}`);
      console.log(`   Auth Key: ${user.authKey}`);
      console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}`);
      console.log(`   Role: ${user.isSuperAdmin ? 'Superadmin' : user.isAdmin ? 'Admin' : 'User'}`);
      console.log(`   Login Count: ${user.loginCount}`);
      console.log(`   Last Login: ${user.lastLoginAt ? user.lastLoginAt.toLocaleString() : 'Never'}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log('─'.repeat(80));
    });
    
    console.log(`Total users: ${users.length}\n`);
  } catch (error) {
    console.error('Error listing users:', error);
  }
};

export const deactivateUser = async (userId: string): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(userId, { isActive: false });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log(`User deactivated: ${user._id}`);
  } catch (error) {
    console.error('Error deactivating user:', error);
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log(`User deleted: ${user._id}`);
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}; 