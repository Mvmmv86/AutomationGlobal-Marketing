/**
 * Simple test script to verify API endpoints work
 */

import { localDataStorage } from './storage/local-storage.js';

async function testLocalStorage() {
  console.log('🧪 Testing Local Storage System...');
  
  // Test user creation
  const testUser = await localDataStorage.createUser({
    email: 'test@local.com',
    password_hash: 'hashed_password',
    name: 'Test User',
    email_verified: false,
    status: 'active'
  });
  
  console.log('✅ User created:', testUser);
  
  // Test organization creation
  const testOrg = await localDataStorage.createOrganization({
    name: 'Test Organization',
    slug: 'test-org',
    status: 'active'
  });
  
  console.log('✅ Organization created:', testOrg);
  
  // Get stats
  const stats = await localDataStorage.getStats();
  console.log('📊 Stats:', stats);
  
  // Get all data
  const users = await localDataStorage.getUsers();
  const orgs = await localDataStorage.getOrganizations();
  
  console.log(`📋 Total Users: ${users.length}`);
  console.log(`📋 Total Organizations: ${orgs.length}`);
}

testLocalStorage().catch(console.error);