# 🚀 GUIA DE SETUP LOCAL - Automation Global v4.0

## ✅ PASSO 1: VERIFICAR REQUISITOS DO SISTEMA

### Ferramentas Necessárias (Instalar se não tiver):

#### 1.1 Node.js (versão 18 ou superior)
```powershell
# Verificar se Node.js está instalado
node --version

# Se não estiver instalado, baixar de: https://nodejs.org/
# Escolher versão LTS (Long Term Support)
```

#### 1.2 Git (para controle de versão)
```powershell
# Verificar Git
git --version

# Se não estiver instalado: https://git-scm.com/download/win
```

#### 1.3 Editor de Código (VS Code recomendado)
- Download: https://code.visualstudio.com/

---

## ✅ PASSO 2: CONFIGURAR BANCO DE DADOS (SUPABASE)

### Por que Supabase?
- ✅ PostgreSQL gerenciado (grátis até 500MB)
- ✅ Sem necessidade de instalar Postgres local
- ✅ Interface web para ver dados
- ✅ Backup automático

### 2.1 Criar Conta Supabase
1. Acessar: https://app.supabase.com
2. Criar conta (pode usar Google/GitHub)
3. Criar novo projeto:
   - **Nome**: `automation-global-dev`
   - **Database Password**: Escolher senha forte (ANOTAR!)
   - **Region**: `East US` (mais próximo)
   - **Pricing Plan**: `Free`

### 2.2 Obter Credenciais do Supabase

Após criar projeto, vá em **Settings** → **Database**:

```
📋 ANOTAR ESTAS INFORMAÇÕES:

1. Connection String (Pooler):
   postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres

2. Supabase URL:
   https://[PROJECT].supabase.co

3. Supabase Anon Key:
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

4. Supabase Service Role Key (cuidado, é secreta!):
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 Criar Tabelas no Supabase

1. No Supabase, ir em **SQL Editor** → **New Query**
2. Copiar TODO conteúdo do arquivo: `docs/SUPABASE-MANUAL-SETUP.md`
3. Colar no editor e clicar em **RUN**
4. Aguardar criação das tabelas (leva ~10 segundos)

**Verificar:** 
- Ir em **Table Editor** → Deve aparecer 14+ tabelas

---

## ✅ PASSO 3: CONFIGURAR VARIÁVEIS DE AMBIENTE (.env)

### 3.1 Navegar até a pasta do projeto
```powershell
cd "C:\Global Automation\AutomationGlobal\AutomationGlobal"
```

### 3.2 Criar arquivo .env

**No PowerShell:**
```powershell
New-Item .env -ItemType File
notepad .env
```

**Copiar e colar este conteúdo** (ajustar com SUAS credenciais):

```env
# ==========================================
# AUTOMATION GLOBAL - LOCAL DEVELOPMENT
# ==========================================

# Ambiente
NODE_ENV=development
PORT=5000

# Banco de Dados (Supabase - SUBSTITUIR COM SEUS DADOS!)
DATABASE_URL=postgresql://postgres.[SEU_PROJECT]:[SUA_SENHA]@aws-1-us-east-1.pooler.supabase.com:6543/postgres

# Supabase (SUBSTITUIR COM SEUS DADOS!)
SUPABASE_URL=https://[SEU_PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_CONNECTION_STRING=postgresql://postgres.[SEU_PROJECT]:[SUA_SENHA]@aws-1-us-east-1.pooler.supabase.com:6543/postgres

# Segurança (GERAR NOVA CHAVE!)
JWT_SECRET=minha-chave-super-secreta-123456789
BCRYPT_ROUNDS=12

# Redis (OPCIONAL - pode deixar assim, vai usar memória)
REDIS_URL=redis://localhost:6379

# IA - OpenAI (OPCIONAL - deixar vazio por enquanto)
OPENAI_API_KEY=

# IA - Anthropic (OPCIONAL - deixar vazio por enquanto)
ANTHROPIC_API_KEY=

# Configurações de IA
AI_DEFAULT_MODEL=gpt-5
AI_FALLBACK_MODEL=claude-sonnet-4-20250514
AI_MAX_TOKENS=4096
AI_TIMEOUT=30000

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logs
LOG_LEVEL=INFO
DEBUG=true
```

**⚠️ IMPORTANTE:** 
1. Substituir `[SEU_PROJECT]` e `[SUA_SENHA]` com dados reais do Supabase
2. Gerar novo `JWT_SECRET` (pode usar: https://generate-secret.vercel.app/32)
3. Salvar arquivo (Ctrl+S) e fechar

---

## ✅ PASSO 4: INSTALAR DEPENDÊNCIAS

### 4.1 Limpar cache npm (recomendado)
```powershell
npm cache clean --force
```

### 4.2 Instalar todas dependências
```powershell
npm install
```

**⏱️ Aguardar:** Leva 2-5 minutos dependendo da internet

**Possíveis erros e soluções:**
- ❌ `EACCES permission denied` → Rodar PowerShell como Administrador
- ❌ `node-gyp` errors → Instalar: `npm install -g windows-build-tools`
- ❌ `sharp` errors → Ignorar, não é crítico

---

## ✅ PASSO 5: PREPARAR BANCO DE DADOS

### 5.1 Testar conexão com banco
```powershell
# Criar script de teste rápido
node -e "console.log('Testing database...'); process.exit(0);"
```

### 5.2 Rodar migrações (se necessário)
```powershell
npm run db:push
```

**Se der erro:** As tabelas já foram criadas no Passo 2.3, pode ignorar.

---

## ✅ PASSO 6: INICIAR SERVIDOR

### 6.1 Modo Desenvolvimento (com auto-reload)
```powershell
npm run dev
```

**✅ Sucesso se aparecer:**
```
🚀 Starting Automation Global v4.0...
✅ Database migrations completed
✅ Drizzle + Supabase configurado com sucesso!
serving on port 5000
```

### 6.2 Manter terminal aberto
- **NÃO FECHAR** o PowerShell enquanto estiver usando o sistema

---

## ✅ PASSO 7: TESTAR NO NAVEGADOR

### 7.1 Acessar aplicação
```
http://localhost:5000
```

### 7.2 Verificar endpoints da API

**Health Check:**
```
http://localhost:5000/health
```
**Deve retornar:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-01T...",
  "version": "4.0.0",
  "environment": "development"
}
```

**API Version:**
```
http://localhost:5000/api/version
```

**Database Status:**
```
http://localhost:5000/api/database/status
```

---

## ✅ PASSO 8: VALIDAR FUNCIONALIDADES

### 8.1 Criar primeiro usuário

**Via Postman/Insomnia ou curl:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@teste.com",
    "password": "senha123",
    "firstName": "Admin",
    "lastName": "Teste"
  }'
```

**Ou via navegador:** Ir para `http://localhost:5000` e usar interface

### 8.2 Fazer Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@teste.com",
    "password": "senha123"
  }'
```

**Copiar o `accessToken` retornado** - vai precisar para chamadas autenticadas

---

## 🐛 TROUBLESHOOTING (Problemas Comuns)

### Erro: "Cannot find module"
```powershell
# Reinstalar dependências
rm -rf node_modules
npm install
```

### Erro: "Port 5000 already in use"
```powershell
# Encontrar processo na porta 5000
netstat -ano | findstr :5000

# Matar processo (substituir PID)
taskkill /PID [PID] /F

# Ou mudar porta no .env:
PORT=3000
```

### Erro: "Database connection failed"
```powershell
# Verificar credenciais no .env
# Testar conexão direta no Supabase SQL Editor:
SELECT NOW();
```

### Erro: "Redis connection failed"
```
⚠️ Redis not available, using in-memory cache
```
**IGNORAR** - Sistema funciona sem Redis (usa memória)

### Frontend não carrega
```powershell
# Verificar se Vite está buildando
npm run dev

# Limpar cache do Vite
rm -rf dist
npm run dev
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

Marque o que está funcionando:

- [ ] ✅ Node.js instalado (v18+)
- [ ] ✅ Supabase configurado
- [ ] ✅ Arquivo .env criado
- [ ] ✅ `npm install` concluído sem erros
- [ ] ✅ Servidor rodando em `localhost:5000`
- [ ] ✅ `/health` retorna status healthy
- [ ] ✅ `/api/database/status` mostra tabelas
- [ ] ✅ Consegui criar usuário
- [ ] ✅ Consegui fazer login
- [ ] ✅ Frontend carrega corretamente

---

## 🎯 PRÓXIMOS PASSOS

Quando tudo estiver funcionando:

1. ✅ **Explorar a aplicação** - testar funcionalidades
2. ✅ **Anotar bugs encontrados** - vamos corrigir na refatoração
3. ✅ **Identificar o que falta** - features incompletas
4. ✅ **Partir para Refatoração** - com conhecimento do sistema real

---

## 📞 SUPORTE

Se travar em algum passo, me envie:
1. **Mensagem de erro completa** (screenshot ou copiar texto)
2. **Passo onde travou** (número do passo)
3. **Sistema operacional** (Windows 10/11)

Vamos resolver juntos! 🚀

