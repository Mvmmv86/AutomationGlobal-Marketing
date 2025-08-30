// Test script for Admin APIs - Task 3.1
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

interface TestResult {
  endpoint: string;
  status: number;
  success: boolean;
  responseTime: number;
  error?: string;
  data?: any;
}

async function testEndpoint(endpoint: string, timeout = 5000): Promise<TestResult> {
  const url = `${BASE_URL}${endpoint}`;
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }
    
    return {
      endpoint,
      status: response.status,
      success: response.ok,
      responseTime,
      data: response.ok ? data : undefined,
      error: !response.ok ? data : undefined
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      endpoint,
      status: 0,
      success: false,
      responseTime,
      error: error.message
    };
  }
}

async function runAdminAPITests() {
  console.log('🧪 Iniciando Testes das APIs Admin - Task 3.1\n');
  
  const endpoints = [
    '/api/health/live',        // Básico - deve funcionar
    '/api/health/ready',       // Health check completo
    '/api/health/metrics',     // Métricas básicas
    '/api/admin/metrics',      // Métricas globais - CORE Task 3.1
    '/api/admin/organizations', // Analytics organizações
    '/api/admin/users',        // Analytics usuários  
    '/api/admin/system'        // Status do sistema
  ];
  
  const results: TestResult[] = [];
  
  for (const endpoint of endpoints) {
    console.log(`🔍 Testando: ${endpoint}`);
    const result = await testEndpoint(endpoint, 10000); // 10s timeout
    results.push(result);
    
    const statusEmoji = result.success ? '✅' : '❌';
    const timeColor = result.responseTime > 1000 ? '🐌' : '⚡';
    
    console.log(`${statusEmoji} ${endpoint}`);
    console.log(`   Status: ${result.status} | Tempo: ${result.responseTime}ms ${timeColor}`);
    
    if (!result.success) {
      console.log(`   Erro: ${result.error}`);
    }
    console.log('');
  }
  
  // Resumo
  console.log('📊 RESUMO DOS TESTES:');
  console.log('='.repeat(50));
  
  const working = results.filter(r => r.success);
  const broken = results.filter(r => !r.success);
  const slow = results.filter(r => r.responseTime > 1000);
  
  console.log(`✅ Funcionando: ${working.length}/${results.length}`);
  console.log(`❌ Com Problema: ${broken.length}/${results.length}`);
  console.log(`🐌 Lentos (>1s): ${slow.length}/${results.length}`);
  
  if (working.length > 0) {
    console.log('\n🎯 ENDPOINTS FUNCIONANDO:');
    working.forEach(r => {
      console.log(`   ✅ ${r.endpoint} (${r.responseTime}ms)`);
    });
  }
  
  if (broken.length > 0) {
    console.log('\n🚨 ENDPOINTS COM PROBLEMA:');
    broken.forEach(r => {
      console.log(`   ❌ ${r.endpoint} - ${r.error || 'Status ' + r.status}`);
    });
  }
  
  // Análise específica Task 3.1
  console.log('\n📋 ANÁLISE TASK 3.1 - Dashboard Admin:');
  console.log('='.repeat(50));
  
  const coreEndpoint = results.find(r => r.endpoint === '/api/admin/metrics');
  if (coreEndpoint?.success) {
    console.log('✅ CORE: API de métricas globais funcionando');
    console.log('✅ Dashboard pode carregar dados básicos');
  } else {
    console.log('❌ PROBLEMA: API de métricas globais não responde');
    console.log('❌ Dashboard não consegue carregar dados');
  }
  
  const healthEndpoint = results.find(r => r.endpoint === '/api/health/live');
  if (healthEndpoint?.success) {
    console.log('✅ Sistema: APIs básicas funcionando');
  } else {
    console.log('❌ Sistema: Problema fundamental nas APIs');
  }
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  if (broken.length === 0) {
    console.log('   ✅ Todas APIs funcionando - testar frontend completo');
    console.log('   ✅ Verificar dados reais nas métricas');
    console.log('   ✅ Testar real-time updates');
  } else {
    console.log('   🔧 Corrigir problemas de conectividade com Supabase');
    console.log('   🔧 Verificar timeouts de database');
    console.log('   🔧 Implementar fallback para dados offline');
  }
}

// Executar testes
runAdminAPITests().catch(console.error);