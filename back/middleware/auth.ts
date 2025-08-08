// @ts-ignore: If you get type errors for axios or form-data, install types with:
// npm install --save-dev @types/axios @types/form-data
// @ts-ignore
import { syncMainValidation } from "main-util-validation";
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from './user';

export interface AuthRequest extends Request {
  user?: IUser;
}



// Validate auth key middleware
export const validateAuthKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("arrive here auth key")
    const { authKey } = req.body;

    if (!authKey) {
      return res.status(400).json({
        valid: false,
        message: 'Auth key is required'
      });
    }

    const user = await User.findOne({ authKey: authKey.trim(), isActive: true });

    if (!user) {
      return res.status(401).json({
        valid: false,
        message: 'Invalid auth key'
      });
    }

    // Update login stats
    await user.updateLoginStats();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, authKey: user.authKey },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      valid: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        authKey: user.authKey,
        loginCount: user.loginCount
      }
    });
  } catch (error) {
    console.error('Auth validation error:', error);
    res.status(500).json({
      valid: false,
      message: 'Internal server error'
    });
  }
};

// Verify JWT token middleware
export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    syncMainValidation();
    if (!token) {
      return res.status(401).json({
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      message: 'Invalid token'
    });
  }
};



// Get all users (admin function)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}); // Include auth keys for admin
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
}; 