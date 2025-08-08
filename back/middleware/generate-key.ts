#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { connectDB } from './database';
import { createAuthKey, listUsers } from './admin';

dotenv.config();

const main = async () => {
  try {
    // Connect to database
    await connectDB();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'generate':
        console.log('Generating new auth key...');
        const authKey = await createAuthKey();
        console.log(`\nSuccess! New auth key: ${authKey}`);
        break;
        
      case 'list':
        await listUsers();
        break;
        
      default:
        console.log('Usage:');
        console.log('  npm run generate-key                    - Generate new auth key');
        console.log('  npm run list-users                      - List all users');
        break;
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

main(); 