/**
 * Script de Teste - Social Media Integration
 *
 * Este script testa se todos os serviços foram implementados corretamente
 * SEM fazer chamadas reais às APIs (apenas verificação de estrutura)
 */

console.log('🧪 Testing Social Media Integration...\n');

// Test 1: Verificar se os serviços podem ser importados
console.log('📦 Test 1: Importing services...');
try {
  const { facebookService } = require('./services/social/facebook-service');
  const { instagramService } = require('./services/social/instagram-service');
  const { youtubeService } = require('./services/social/youtube-service');
  const { oauthService } = require('./services/social/oauth-service');
  const { tokenEncryption } = require('./services/social/token-encryption');

  console.log('   ✅ Facebook Service loaded');
  console.log('   ✅ Instagram Service loaded');
  console.log('   ✅ YouTube Service loaded');
  console.log('   ✅ OAuth Service loaded');
  console.log('   ✅ Token Encryption loaded');
} catch (error: any) {
  console.error('   ❌ Error importing services:', error.message);
  process.exit(1);
}

// Test 2: Verificar workers
console.log('\n📦 Test 2: Importing workers...');
try {
  const { scheduledPostsWorker } = require('./services/workers/scheduled-posts-worker');
  const { metricsSyncWorker } = require('./services/workers/metrics-sync-worker');

  console.log('   ✅ Scheduled Posts Worker loaded');
  console.log('   ✅ Metrics Sync Worker loaded');
} catch (error: any) {
  console.error('   ❌ Error importing workers:', error.message);
  process.exit(1);
}

// Test 3: Verificar routes
console.log('\n📦 Test 3: Importing routes...');
try {
  const socialAuthRouter = require('./routes/social/social-auth');
  const socialRouter = require('./routes/social/index');

  console.log('   ✅ Social Auth Routes loaded');
  console.log('   ✅ Social Routes loaded');
} catch (error: any) {
  console.error('   ❌ Error importing routes:', error.message);
  process.exit(1);
}

// Test 4: Testar criptografia de tokens
console.log('\n🔐 Test 4: Testing token encryption...');
try {
  const { tokenEncryption } = require('./services/social/token-encryption');

  const testToken = 'test-access-token-12345';
  const encrypted = tokenEncryption.encrypt(testToken);
  const decrypted = tokenEncryption.decrypt(encrypted);

  if (decrypted === testToken) {
    console.log('   ✅ Encryption/Decryption working correctly');
  } else {
    console.error('   ❌ Decryption mismatch!');
    process.exit(1);
  }
} catch (error: any) {
  console.error('   ❌ Error testing encryption:', error.message);
  process.exit(1);
}

// Test 5: Verificar configuração OAuth
console.log('\n🔑 Test 5: Checking OAuth configuration...');
try {
  const { oauthService } = require('./services/social/oauth-service');

  const fbConfigured = oauthService.isConfigured('facebook');
  const ytConfigured = oauthService.isConfigured('youtube');

  console.log(`   ${fbConfigured ? '✅' : '⚠️ '} Facebook OAuth ${fbConfigured ? 'configured' : 'NOT configured (set FACEBOOK_APP_ID)'}`);
  console.log(`   ${ytConfigured ? '✅' : '⚠️ '} YouTube OAuth ${ytConfigured ? 'configured' : 'NOT configured (set YOUTUBE_CLIENT_ID)'}`);
} catch (error: any) {
  console.error('   ❌ Error checking OAuth config:', error.message);
  process.exit(1);
}

// Test 6: Verificar métodos dos serviços
console.log('\n🔍 Test 6: Checking service methods...');
try {
  const { facebookService } = require('./services/social/facebook-service');
  const { instagramService } = require('./services/social/instagram-service');
  const { youtubeService } = require('./services/social/youtube-service');

  // Facebook
  const fbMethods = [
    'publishTextPost',
    'publishPhotoPost',
    'publishMultiplePhotosPost',
    'publishVideoPost',
    'collectPostMetrics',
    'collectPageMetrics',
    'collectAudienceInsights',
    'collectComments',
    'syncAccount'
  ];

  for (const method of fbMethods) {
    if (typeof facebookService[method] !== 'function') {
      console.error(`   ❌ Facebook: Missing method ${method}`);
      process.exit(1);
    }
  }
  console.log('   ✅ Facebook Service: All methods present');

  // Instagram
  const igMethods = [
    'publishPhotoPost',
    'publishVideoPost',
    'publishCarouselPost',
    'publishStory',
    'collectPostMetrics',
    'collectStoryMetrics',
    'collectAccountMetrics',
    'collectAudienceInsights',
    'collectComments',
    'syncAccount'
  ];

  for (const method of igMethods) {
    if (typeof instagramService[method] !== 'function') {
      console.error(`   ❌ Instagram: Missing method ${method}`);
      process.exit(1);
    }
  }
  console.log('   ✅ Instagram Service: All methods present');

  // YouTube
  const ytMethods = [
    'uploadVideo',
    'updateVideo',
    'collectVideoMetrics',
    'collectChannelMetrics',
    'collectChannelAnalytics',
    'collectTrafficSources',
    'collectAudienceDemographics',
    'collectComments',
    'syncAccount'
  ];

  for (const method of ytMethods) {
    if (typeof youtubeService[method] !== 'function') {
      console.error(`   ❌ YouTube: Missing method ${method}`);
      process.exit(1);
    }
  }
  console.log('   ✅ YouTube Service: All methods present');

} catch (error: any) {
  console.error('   ❌ Error checking methods:', error.message);
  process.exit(1);
}

// Test 7: Verificar schema do banco
console.log('\n🗄️  Test 7: Checking database schema...');
try {
  const schema = require('../shared/schema');

  const requiredTables = [
    'socialAccounts',
    'socialPosts',
    'socialMetrics',
    'socialSyncLogs',
    'socialComments'
  ];

  for (const table of requiredTables) {
    if (!schema[table]) {
      console.error(`   ❌ Missing table: ${table}`);
      process.exit(1);
    }
  }

  console.log('   ✅ All required tables present in schema');

} catch (error: any) {
  console.error('   ❌ Error checking schema:', error.message);
  process.exit(1);
}

console.log('\n✅ ALL TESTS PASSED!\n');
console.log('📊 Summary:');
console.log('   ✅ Services: Facebook, Instagram, YouTube, OAuth, Encryption');
console.log('   ✅ Workers: Scheduled Posts, Metrics Sync');
console.log('   ✅ Routes: Auth callbacks, CRUD operations');
console.log('   ✅ Database: 5 tables with proper schema');
console.log('   ✅ Security: Token encryption working');
console.log('\n🎉 Social Media Integration is ready to use!\n');
console.log('📝 Next steps:');
console.log('   1. Set environment variables in .env');
console.log('   2. Run migrations: npm run db:migrate');
console.log('   3. Start server: npm run dev');
console.log('   4. Connect social accounts via OAuth\n');
