# 🚀 RODAR MIGRATION - 2 PASSOS SIMPLES

## ✅ PASSO 1: Criar função helper (30 segundos)

1. Acesse: https://zqzxaulmzwymkybctnzw.supabase.co
2. Clique em **"SQL Editor"** no menu lateral
3. Clique em **"New query"**
4. Copie e cole este código:

```sql
-- Criar função para executar SQL
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;
```

5. Clique em **"Run"** (ou Ctrl+Enter)
6. Deve aparecer: `Success. No rows returned`

---

## ✅ PASSO 2: Rodar a migration (30 segundos)

1. No mesmo SQL Editor, clique em **"New query"** novamente
2. Abra o arquivo no seu computador: `server/db/migrations/005_social_integrations.sql`
3. Copie **TODO** o conteúdo (278 linhas)
4. Cole no SQL Editor
5. Clique em **"Run"** (ou Ctrl+Enter)
6. Aguarde 5-10 segundos

**Resultado esperado:**
- Se aparecer "Success" ou "Query executed" → FUNCIONOU! ✅
- Se der erro, me envie a mensagem de erro completa

---

## 🔍 PASSO 3: Verificar (10 segundos)

Depois de rodar, execute este comando no terminal:

```bash
node check-supabase-api.js
```

**Deve aparecer:**
```
✅ social_accounts           EXISTE
✅ social_posts              EXISTE
✅ social_metrics            EXISTE
✅ social_sync_logs          EXISTE
✅ social_comments           EXISTE
```

---

## ⚡ ALTERNATIVA RÁPIDA

Se quiser, me passa a **senha do banco de dados** e eu rodo tudo automaticamente!

A senha fica em: **Supabase → Settings → Database → Database Password**

É diferente da que está no `.env` (aquela está URL-encoded e pode estar incorreta).

---

## ❌ POSSÍVEIS ERROS

### Erro: "relation already exists"
**Solução:** Tudo bem! Significa que a tabela já existe. Continue.

### Erro: "function exec_sql already exists"
**Solução:** Tudo bem! Pule o Passo 1 e vá direto para o Passo 2.

### Erro: "permission denied"
**Solução:** Certifique-se de estar logado como Owner no Supabase.

---

## 🎯 DEPOIS DA MIGRATION

Quando as 5 tabelas estiverem criadas, vamos para:

1. ✅ **Inicializar os Workers** (5 min) - editar `server/index.ts`
2. ✅ **Configurar OAuth** (15 min) - Facebook + YouTube
3. ✅ **Testar** (10 min) - conectar conta e publicar post

---

**Me avise quando terminar ou se aparecer algum erro!** 🚀
