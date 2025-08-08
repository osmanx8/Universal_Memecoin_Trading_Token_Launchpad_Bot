import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './middleware/database';
import { validateAuthKey, getAllUsers } from './middleware/auth';
import { createAuthKey, createAdminKey, deleteUser } from './middleware/admin';
import { User } from './middleware/user';
import { WalletService } from './controllers/wallet_controller';
import multer from 'multer';
import { MetadataController } from './controllers/metadata_controller';
import { VanityController } from './controllers/vanity_controller';
import { SnipeBundleController } from './controllers/snipebundle_controller';
import { TokenLaunch } from './middleware/token';

const upload = multer({ dest: 'uploads/' });

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Superadmin configuration
const SUPERADMIN_KEY = process.env.SUPERADMIN_KEY || 'superadmin2024';

// Create superadmin user if it doesn't exist
const ensureSuperAdminExists = async (): Promise<void> => {
  try {
    const superAdminUser = await User.findOne({ authKey: SUPERADMIN_KEY });

    if (!superAdminUser) {
      const newSuperAdmin = new User({
        authKey: SUPERADMIN_KEY,
        isAdmin: true,
        isSuperAdmin: true
      });

      await newSuperAdmin.save();
      console.log(`Superadmin user created with key: ${SUPERADMIN_KEY}`);
    } else {
      // Ensure superadmin has correct flags
      if (!superAdminUser.isSuperAdmin) {
        superAdminUser.isSuperAdmin = true;
        superAdminUser.isAdmin = true;
        await superAdminUser.save();
        console.log(`Updated existing user to superadmin: ${SUPERADMIN_KEY}`);
      } else {
        console.log(`Superadmin user already exists with key: ${SUPERADMIN_KEY}`);
      }
    }
  } catch (error) {
    console.error('Error ensuring superadmin exists:', error);
  }
};

// Connect to MongoDB and ensure superadmin exists
connectDB().then(() => {
  ensureSuperAdminExists();
});

// Middleware
app.use(helmet());
// app.use(cors({
//   origin: process.env.NODE_ENV === 'production'
//     ? ['https://yourdomain.com']
//     : ['http://localhost:3000'],
//   credentials: true
// }));
// Custom morgan configuration to exclude balance check requests
app.use(morgan('combined', {
  skip: (req, res) => req.path === '/api/snipebundle/buyer-balance'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth routes
app.post('/api/auth/validate', validateAuthKey);
app.get('/api/auth/users', getAllUsers);

// Superadmin key validation middleware
const validateSuperAdminKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;

  if (!adminKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Superadmin key required'
    });
  }

  try {
    // Check if superadmin key exists as a valid user in database
    const adminUser = await User.findOne({ authKey: adminKey, isActive: true, isSuperAdmin: true });

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Invalid superadmin key'
      });
    }

    next();
  } catch (error) {
    console.error('Superadmin validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Admin key validation middleware (for regular admins)
const validateAdminKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;

  if (!adminKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Admin key required'
    });
  }

  try {
    // Check if admin key exists as a valid user in database
    const adminUser = await User.findOne({ authKey: adminKey, isActive: true, isAdmin: true });

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Invalid admin key'
      });
    }

    next();
  } catch (error) {
    console.error('Admin validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Superadmin routes (protected by superadmin key)
app.post('/api/superadmin/create-admin-key', validateSuperAdminKey, async (req: express.Request, res: express.Response) => {
  try {
    const adminKey = await createAdminKey();
    res.json({
      success: true,
      adminKey,
      message: 'Admin key created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create admin key'
    });
  }
});

app.post('/api/superadmin/create-auth-key', validateSuperAdminKey, async (req: express.Request, res: express.Response) => {
  try {
    const authKey = await createAuthKey();
    res.json({
      success: true,
      authKey,
      message: 'Auth key created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create auth key'
    });
  }
});

app.get('/api/superadmin/users', validateSuperAdminKey, getAllUsers);

app.delete('/api/superadmin/users/:userId', validateSuperAdminKey, async (req: express.Request, res: express.Response) => {
  try {
    await deleteUser(req.params.userId);
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Admin delete route - can only delete regular users, not admins
app.delete('/api/admin/users/:userId', validateAdminKey, async (req: express.Request, res: express.Response) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is admin or superadmin
    if (user.isAdmin || user.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot delete other admins or superadmin'
      });
    }

    await deleteUser(req.params.userId);
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Admin routes (protected by admin key)
app.post('/api/admin/create-auth-key', validateAdminKey, async (req: express.Request, res: express.Response) => {
  try {
    const authKey = await createAuthKey();
    res.json({
      success: true,
      authKey,
      message: 'Auth key created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create auth key'
    });
  }
});

app.get('/api/admin/users', validateAdminKey, getAllUsers);

// Wallet generation route
app.post('/api/wallets/generate', async (req, res) => {
  try {
    const { type, authKey } = req.body;
    const { publicKey, secretKey } = await WalletService.generateWallet(type, authKey);
    res.json({ success: true, publicKey, secretKey, type });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: err.message });
  }
});

// Wallet balance route
app.post('/api/wallets/balance', async (req, res) => {
  try {
    const { publicKey } = req.body;
    const balance = await WalletService.getBalance(publicKey);
    res.json({ success: true, balance });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: err.message });
  }
});

// Wallet derive public key route
app.post('/api/wallets/derive-public-key', async (req, res) => {
  try {
    const { privateKey } = req.body;
    const publicKey = await WalletService.derivePublicKey(privateKey);
    res.json({ success: true, publicKey });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post(
  '/api/metadata/prepare-mint',
  upload.single('file'), // 'file' is the field name for the image
  MetadataController.prepareMint
);

app.post('/api/mintedTokens', MetadataController.saveMintedToken);

app.get('/api/mintedTokens', async (req, res) => {
  const { user } = req.query; // user = authKey
  if (!user) {
    return res.status(400).json({ success: false, message: 'Missing user (authKey)' });
  }
  try {
    const tokens = await TokenLaunch.find({ authKey: user }).sort({ createdAt: -1 });
    res.json(tokens);
  } catch (e) {
    res.status(500).json({ success: false, message: (e as any).message });
  }
});

app.get('/api/mintedTokens/:id', async (req, res) => {
  try {
    const token = await TokenLaunch.findById(req.params.id);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }
    res.json(token);
  } catch (e) {
    res.status(500).json({ success: false, message: (e as any).message });
  }
});

app.get('/api/launch/next-vanity-mint-key', VanityController.getNextVanityMintKey);
app.post('/api/launch/confirm-vanity-usage', VanityController.confirmVanityUsage);
app.post('/api/launch/fail-vanity-usage', VanityController.failVanityUsage);
app.get('/api/launch/vanity-stats', VanityController.getVanityStats);

app.post('/api/snipebundle/buyer-balance', SnipeBundleController.checkBuyerBalance);
app.post('/api/snipebundle/fund-snipers', SnipeBundleController.fundSnipers);
app.post('/api/snipebundle/create-token', SnipeBundleController.createToken);
app.get('/api/snipebundle/get-snipers/:mintId', SnipeBundleController.getSnipers);

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 