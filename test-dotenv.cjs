const dotenv = require('dotenv');
const fs = require('fs');

console.log('=== TESTE DOTENV ===');

// Ler o arquivo .env
const content = fs.readFileSync('.env', 'utf8');
console.log('File size:', content.length);
console.log('Lines:', content.split('\n').length);

// Carregar dotenv
const result = dotenv.config();

console.log('\n=== RESULTADO ===');
console.log('Error:', result.error);
console.log('Parsed vars:', Object.keys(result.parsed || {}).length);

if (result.parsed) {
  console.log('\n=== CHAVES ENCONTRADAS ===');
  Object.keys(result.parsed).forEach(key => {
    const value = result.parsed[key];
    console.log(`${key}: ${value ? value.substring(0, 20) + '...' : '(empty)'}`);
  });

  console.log('\n=== API KEYS ===');
  console.log('OPENAI_API_KEY exists:', !!result.parsed.OPENAI_API_KEY);
  console.log('ANTHROPIC_API_KEY exists:', !!result.parsed.ANTHROPIC_API_KEY);

  if (result.parsed.OPENAI_API_KEY) {
    console.log('OPENAI first 20 chars:', result.parsed.OPENAI_API_KEY.substring(0, 20));
  }
  if (result.parsed.ANTHROPIC_API_KEY) {
    console.log('ANTHROPIC first 20 chars:', result.parsed.ANTHROPIC_API_KEY.substring(0, 20));
  }
}

console.log('\n=== PROCESS.ENV ===');
console.log('process.env.OPENAI_API_KEY:', !!process.env.OPENAI_API_KEY);
console.log('process.env.ANTHROPIC_API_KEY:', !!process.env.ANTHROPIC_API_KEY);
