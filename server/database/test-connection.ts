// Teste direto de conexão com Supabase
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  method: string;
  details: any;
  error?: string;
}> {
  console.log('🔍 Testing Supabase connection methods...');
  
  // Método 1: Tentar conexão direta PostgreSQL
  let directConnection = false;
  let directError = '';
  
  try {
    const postgres = await import('postgres');
    const sql = postgres.default(process.env.DATABASE_URL!, {
      ssl: 'require',
      max: 1,
      connect_timeout: 3,
      prepare: false,
    });
    
    const result = await sql`SELECT version()`;
    await sql.end();
    directConnection = true;
    console.log('✅ Direct PostgreSQL connection successful');
  } catch (error: any) {
    directError = error.message;
    console.log(`❌ Direct connection failed: ${directError}`);
  }

  // Método 2: Tentar via HTTP API do Supabase (REST)
  let apiConnection = false;
  let apiError = '';
  
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        },
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        apiConnection = true;
        console.log('✅ Supabase REST API connection successful');
      } else {
        apiError = `HTTP ${response.status}`;
      }
    } catch (error: any) {
      apiError = error.message;
      console.log(`❌ REST API connection failed: ${apiError}`);
    }
  } else {
    apiError = 'Missing SUPABASE_URL or SUPABASE_ANON_KEY';
  }

  // Método 3: Verificar se estamos no Replit
  const isReplit = !!process.env.REPLIT_DB_URL;
  const replitLimitation = isReplit && !directConnection;
  
  return {
    connected: directConnection || apiConnection,
    method: directConnection ? 'PostgreSQL Direct' : 
            apiConnection ? 'Supabase REST API' : 
            'None - Using Simulation',
    details: {
      postgresql: {
        attempted: true,
        connected: directConnection,
        error: directError || null,
        url: process.env.DATABASE_URL ? 'Configured' : 'Missing'
      },
      restApi: {
        attempted: !!process.env.SUPABASE_URL,
        connected: apiConnection,
        error: apiError || null,
        url: process.env.SUPABASE_URL || 'Not configured'
      },
      environment: {
        isReplit,
        hasNetworkLimitation: replitLimitation,
        nodeEnv: process.env.NODE_ENV
      },
      recommendation: replitLimitation ? 
        'Replit blocks external PostgreSQL connections. Consider using Supabase REST API or deploying to production.' :
        'Connection should work in production environment.'
    },
    error: directError || apiError || undefined
  };
}

// Teste alternativo com pooling otimizado
export async function testOptimizedConnection(): Promise<boolean> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.log('⚠️ Supabase REST API credentials not configured');
      return false;
    }
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (!error) {
      console.log('✅ Supabase client connection successful');
      return true;
    }
    
    console.log(`❌ Supabase client error: ${error.message}`);
    return false;
    
  } catch (error: any) {
    console.log(`❌ Supabase client failed: ${error.message}`);
    return false;
  }
}