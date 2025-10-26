# ⚡ Guia Rápido: Conectar Supabase

**Tempo:** ~15 minutos | **Dificuldade:** Fácil

---

## 🎯 Objetivo Rápido

Conectar o Automation Global ao banco de dados Supabase em 3 passos simples.

---

## 📋 Passo 1: Obter Credenciais (5 min)

1. Acesse: https://app.supabase.com
2. Selecione seu projeto (ou crie um novo)
3. Vá em **Settings** → **API**
4. Copie:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`
5. Vá em **Settings** → **Database**
6. Copie: `Connection string` (substitua `[YOUR-PASSWORD]`)

---

## 📝 Passo 2: Atualizar .env (2 min)

Edite o arquivo `.env` no projeto:

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database
DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@db.xxxxx.supabase.co:5432/postgres
```

---

## 🚀 Passo 3: Testar (3 min)

```bash
# 1. Reiniciar servidor
npm run dev

# 2. Verificar health
curl http://localhost:5000/api/health

# 3. Testar registro
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@test.com","password":"Test123!","name":"Teste","planType":"starter"}'
```

---

## ✅ Pronto!

Se tudo funcionou:
- ✅ Health check retorna `database: healthy`
- ✅ Registro retorna status `201`
- ✅ Sem erros de timeout no console

---

**Problemas?** Veja o guia completo: `PLANO-CONEXAO-SUPABASE.md`

