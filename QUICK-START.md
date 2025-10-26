# ⚡ QUICK START - Rodar em 10 Minutos

## 🎯 Pré-requisitos
- ✅ Node.js 18+ instalado
- ✅ Conta Supabase criada (grátis)

---

## 🚀 Passo-a-Passo Rápido

### 1️⃣ Navegar até a pasta (PowerShell)
```powershell
cd "C:\Global Automation\AutomationGlobal\AutomationGlobal"
```

### 2️⃣ Criar arquivo .env
```powershell
# Copiar template
Copy-Item ENV-TEMPLATE.txt .env

# Editar com Notepad
notepad .env
```

**Preencher apenas estas linhas essenciais:**
```env
DATABASE_URL=postgresql://postgres.SEU_PROJECT:SUA_SENHA@aws-1-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://SEU_PROJECT.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_KEY=sua_chave_service_aqui
JWT_SECRET=qualquer-texto-aleatorio-com-mais-de-32-caracteres
```

> 💡 Obter credenciais Supabase em: https://app.supabase.com → Settings → API

### 3️⃣ Executar SQL no Supabase
1. Ir para: https://app.supabase.com
2. Abrir **SQL Editor** → **New Query**
3. Copiar conteúdo de: `docs/SUPABASE-MANUAL-SETUP.md`
4. Colar e clicar **RUN**

### 4️⃣ Instalar dependências
```powershell
npm install
```
⏱️ *Aguardar 2-5 minutos*

### 5️⃣ Validar setup (OPCIONAL mas recomendado)
```powershell
node scripts/validate-setup.js
```

### 6️⃣ Iniciar servidor
```powershell
npm run dev
```

### 7️⃣ Acessar aplicação
```
http://localhost:5000
```

---

## ✅ Verificação Rápida

Testar endpoints:
- http://localhost:5000/health ← Deve retornar `"status": "healthy"`
- http://localhost:5000/api/version ← Deve retornar versão 4.0.0
- http://localhost:5000/api/database/status ← Deve listar tabelas

---

## 🐛 Problema? 

### Erro: "Cannot find module"
```powershell
npm install
```

### Erro: "Database connection failed"
- Verificar credenciais no `.env`
- Testar SQL direto no Supabase

### Erro: "Port 5000 already in use"
```powershell
# Mudar porta no .env
PORT=3000
```

### Outros erros
📖 Consultar: `SETUP-LOCAL-GUIDE.md` (guia completo)

---

## 📞 Próximos Passos

1. ✅ Criar usuário: `POST /api/auth/register`
2. ✅ Fazer login: `POST /api/auth/login`
3. ✅ Explorar dashboard
4. ✅ Testar funcionalidades

**Guia completo:** `SETUP-LOCAL-GUIDE.md`

