# 📋 PLANO DE AÇÃO: Sistema de Campanhas Multi-Rede

## 🎯 Objetivos Gerais

1. Remover "Facebook" do título e tornar a página genérica "Campanhas"
2. Integrar automaticamente as redes sociais já conectadas na Home
3. Permitir seleção de rede social ao criar nova campanha
4. Implementar fluxos simplificados para usuários leigos baseados nas APIs oficiais de cada plataforma

---

## 📊 ANÁLISE DAS APIs (Pesquisa Realizada)

### **Meta Ads API (Instagram + Facebook)**
- **Status**: ✅ Totalmente suportado
- **Estrutura**: Campaign → Ad Set → Ads (3 níveis)
- **Objetivos Simplificados 2024**: Awareness, Traffic, Engagement, Leads, App Promotion, Sales
- **Parâmetros Principais**:
  - `name`: Nome da campanha
  - `objective`: OUTCOME_SALES, OUTCOME_LEADS, OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, OUTCOME_AWARENESS, OUTCOME_APP_PROMOTION
  - `status`: ACTIVE ou PAUSED
  - `buying_type`: AUCTION (padrão)
  - `bid_strategy`: LOWEST_COST_WITHOUT_CAP
  - `daily_budget` ou `lifetime_budget`
  - `start_time` e `end_time` (opcional)

### **Google Ads API (Search + Display + YouTube)**
- **Status**: ✅ Suportado para Search e Display | ⚠️ YouTube apenas leitura
- **Estrutura**: Campaign → Ad Groups → Ads
- **Parâmetros Principais**:
  - `name`: Nome da campanha
  - `advertising_channel_type`: SEARCH, DISPLAY, VIDEO, SHOPPING
  - `budget`: Valor do orçamento
  - `bidding_strategy_type`: TARGET_CPA, TARGET_ROAS, MAXIMIZE_CONVERSIONS
  - `target_cpa` ou `target_roas`
  - `start_date` e `end_date` (opcional)

### **LinkedIn Ads API**
- **Status**: ✅ Totalmente suportado
- **Estrutura**: Campaign → Creative
- **Parâmetros Principais**:
  - `name`: Nome da campanha
  - `objectiveType`: BRAND_AWARENESS, WEBSITE_VISITS, ENGAGEMENT, VIDEO_VIEWS, LEAD_GENERATION, JOB_APPLICANTS
  - `dailyBudget`: { amount, currencyCode }
  - `runSchedule`: { start, end }
  - `pacingStrategy`: LIFETIME ou ACCELERATED
  - `targetingCriteria`: Audiência (mínimo 300 membros)

### **TikTok Ads API**
- **Status**: ✅ Totalmente suportado
- **Estrutura**: Campaign → Ad Group → Ads
- **Parâmetros Principais**:
  - `campaign_name`: Nome (até 512 caracteres)
  - `objective_type`: REACH, TRAFFIC, APP_PROMOTION, VIDEO_VIEWS, CONVERSIONS, LEAD_GENERATION
  - `budget_mode`: BUDGET_MODE_DAY, BUDGET_MODE_TOTAL
  - `budget`: Valor do orçamento
  - `advertiser_id`: ID do anunciante

### **YouTube Ads (via Google Ads API)**
- **Status**: ⚠️ Criação NÃO suportada pela API (apenas leitura)
- **Alternativa**: Demand Gen Campaigns (serve vídeos no YouTube + outras propriedades Google)
- **Workaround**: Usuários precisam criar via Google Ads UI

---

## 🏗️ ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMPANHAS DASHBOARD                       │
│  - Header genérico "Campanhas"                              │
│  - Tabs dinâmicas com redes conectadas (da Home)            │
│  - Stats agregadas por rede social                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              BOTÃO "NOVA CAMPANHA" MODAL                     │
│  1. Selecionar Rede Social (apenas conectadas)              │
│  2. Redirecionar para wizard específico da rede             │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                        ▼
┌──────────────────┐                  ┌──────────────────┐
│  META (IG + FB)  │                  │   GOOGLE ADS     │
│   Wizard (3      │                  │   Wizard (3      │
│   passos)        │                  │   passos)        │
└──────────────────┘                  └──────────────────┘
        ▼                                        ▼
┌──────────────────┐                  ┌──────────────────┐
│    LINKEDIN      │                  │     TIKTOK       │
│   Wizard (3      │                  │   Wizard (3      │
│   passos)        │                  │   passos)        │
└──────────────────┘                  └──────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │     YOUTUBE      │
                  │  (Demand Gen)    │
                  │   Wizard (3      │
                  │   passos)        │
                  └──────────────────┘
```

---

## 📝 FASES DE IMPLEMENTAÇÃO DETALHADAS

### **FASE 1: Atualizar Header da Página Campanhas**

**Objetivo**: Remover "Campanhas Facebook" e tornar genérico "Campanhas"

**Arquivos a modificar**:
- `client/src/pages/CampaignsDashboard.tsx`

**Ações**:
1. Alterar título de "Campanhas Facebook" para "Campanhas"
2. Atualizar descrição para algo genérico: "Gerencie suas campanhas de todas as redes sociais conectadas"
3. Remover ícones específicos do Facebook do header
4. Adicionar ícone genérico (ex: `Target`, `TrendingUp`)

---

### **FASE 2: Criar Sistema de Integração com Redes Sociais Conectadas**

**Objetivo**: Buscar automaticamente as redes conectadas da Home e exibir tabs dinâmicas

**Arquivos a criar/modificar**:
- `client/src/components/campaigns/SocialNetworkFilter.tsx` (novo)
- `client/src/pages/CampaignsDashboard.tsx` (modificar)

**Ações**:
1. Reutilizar query de redes conectadas: `useQuery(['/api/social/networks/connected'])`
2. Criar componente `SocialNetworkFilter` com tabs para cada rede conectada
3. Adicionar tab "Todas" para visualizar campanhas agregadas
4. Filtrar campanhas por rede selecionada
5. Atualizar stats cards para refletir rede selecionada

**Mockup de Tabs**:
```
┌────────────────────────────────────────────────────────────┐
│ [Todas] [Instagram] [Facebook] [LinkedIn] [TikTok] [...]  │
└────────────────────────────────────────────────────────────┘
```

---

### **FASE 3: Implementar Seletor de Rede Social no Botão "Nova Campanha"**

**Objetivo**: Ao clicar em "Nova Campanha", abrir modal para escolher a rede social

**Arquivos a criar/modificar**:
- `client/src/components/campaigns/SelectNetworkModal.tsx` (novo)
- `client/src/pages/CampaignsDashboard.tsx` (modificar)

**Ações**:
1. Criar modal `SelectNetworkModal` que lista apenas redes conectadas
2. Exibir cards visuais com ícone, nome e status de cada rede
3. Ao selecionar rede, abrir wizard específico daquela plataforma
4. Adicionar botão "Conectar Nova Rede" que redireciona para Home → Conectar

**Layout do Modal**:
```
╔════════════════════════════════════════════════════════════╗
║           Selecione a Rede Social da Campanha             ║
╠════════════════════════════════════════════════════════════╣
║  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ║
║  │    📷    │  │    👤    │  │    💼    │  │    🎵    │  ║
║  │Instagram │  │ Facebook │  │ LinkedIn │  │  TikTok  │  ║
║  │Conectado │  │Conectado │  │Conectado │  │Conectado │  ║
║  └──────────┘  └──────────┘  └──────────┘  └──────────┘  ║
║                                                            ║
║              [+ Conectar Nova Rede Social]                ║
╚════════════════════════════════════════════════════════════╝
```

---

### **FASE 4A: Criar Fluxo Simplificado Instagram/Facebook (Meta Ads API)**

**Objetivo**: Wizard de 3 passos super simplificado para usuários leigos

**Arquivos a criar**:
- `client/src/components/campaigns/wizards/MetaCampaignWizard.tsx`
- `client/src/components/campaigns/wizards/steps/MetaStep1Objective.tsx`
- `client/src/components/campaigns/wizards/steps/MetaStep2Audience.tsx`
- `client/src/components/campaigns/wizards/steps/MetaStep3BudgetSchedule.tsx`

**Estrutura do Wizard**:

#### **Passo 1: Objetivo da Campanha**
```
┌─────────────────────────────────────────────────────────┐
│  Qual o objetivo da sua campanha?                       │
│                                                          │
│  ○ Aumentar Vendas (OUTCOME_SALES)                      │
│     "Leve mais pessoas para comprar no seu site"        │
│                                                          │
│  ○ Gerar Leads (OUTCOME_LEADS)                          │
│     "Capture contatos e informações de clientes"        │
│                                                          │
│  ○ Aumentar Tráfego (OUTCOME_TRAFFIC)                   │
│     "Leve mais pessoas para o seu site ou app"          │
│                                                          │
│  ○ Aumentar Engajamento (OUTCOME_ENGAGEMENT)            │
│     "Mais curtidas, comentários e compartilhamentos"    │
│                                                          │
│  ○ Aumentar Conhecimento (OUTCOME_AWARENESS)            │
│     "Mais pessoas conhecendo sua marca"                 │
│                                                          │
│  ○ Promover App (OUTCOME_APP_PROMOTION)                 │
│     "Mais instalações e uso do seu aplicativo"          │
└─────────────────────────────────────────────────────────┘
```

#### **Passo 2: Público-Alvo** (SIMPLIFICADO)
```
┌─────────────────────────────────────────────────────────┐
│  Quem você quer atingir?                                 │
│                                                          │
│  ● Localização                                           │
│    [Brasil ▼]  [+ Adicionar cidade/estado]              │
│                                                          │
│  ● Idade                                                 │
│    De [18 ▼] até [65+ ▼]                                │
│                                                          │
│  ● Gênero                                                │
│    [○ Todos  ○ Homens  ○ Mulheres]                      │
│                                                          │
│  ● Interesses (opcional)                                 │
│    [Adicionar interesses...  🔍]                         │
│    Ex: Tecnologia, Esportes, Moda                        │
│                                                          │
│  ☑️ Usar público existente salvo                         │
│    [Selecionar público... ▼]                             │
└─────────────────────────────────────────────────────────┘
```

#### **Passo 3: Orçamento e Programação**
```
┌─────────────────────────────────────────────────────────┐
│  Configure o orçamento e período                         │
│                                                          │
│  Nome da Campanha:                                       │
│  [Campanha Verão 2025_____________]                      │
│                                                          │
│  Tipo de Orçamento:                                      │
│  ○ Orçamento Diário: R$ [100,00] por dia                │
│  ○ Orçamento Total: R$ [3.000,00] para todo período     │
│                                                          │
│  Estratégia de Lance:                                    │
│  ● Custo Mais Baixo (recomendado para iniciantes)       │
│  ○ Limite de Custo                                       │
│                                                          │
│  Período da Campanha:                                    │
│  ○ Contínuo (roda até pausar manualmente)               │
│  ● Programado                                            │
│    De [2025-01-20 📅] às [00:00]                        │
│    Até [2025-02-20 📅] às [23:59]                       │
│                                                          │
│  ──────────────────────────────────────────              │
│  Estimativa de Alcance: ~50.000 - 75.000 pessoas        │
│  Investimento Total: R$ 3.000,00                         │
│                                                          │
│  [Voltar]                        [Criar Campanha ✓]     │
└─────────────────────────────────────────────────────────┘
```

**Parâmetros da API**:
```typescript
{
  name: "Campanha Verão 2025",
  objective: "OUTCOME_SALES",
  status: "PAUSED", // Criar pausada para revisão
  buying_type: "AUCTION",
  bid_strategy: "LOWEST_COST_WITHOUT_CAP",
  daily_budget: 10000, // em centavos
  // OU lifetime_budget: 300000,
  start_time: "2025-01-20T00:00:00",
  end_time: "2025-02-20T23:59:59",
  targeting: {
    geo_locations: { countries: ["BR"] },
    age_min: 18,
    age_max: 65,
    genders: [1, 2], // All
    interests: [...]
  }
}
```

---

### **FASE 4B: Criar Fluxo Simplificado Google Ads API**

**Objetivo**: Wizard de 3 passos para Search e Display campaigns

**Arquivos a criar**:
- `client/src/components/campaigns/wizards/GoogleAdsCampaignWizard.tsx`
- `client/src/components/campaigns/wizards/steps/GoogleAdsStep1Type.tsx`
- `client/src/components/campaigns/wizards/steps/GoogleAdsStep2Targeting.tsx`
- `client/src/components/campaigns/wizards/steps/GoogleAdsStep3Budget.tsx`

**Estrutura do Wizard**:

#### **Passo 1: Tipo de Campanha**
```
┌─────────────────────────────────────────────────────────┐
│  Escolha o tipo de campanha Google Ads                  │
│                                                          │
│  ○ Rede de Pesquisa (SEARCH)                            │
│     "Apareça quando as pessoas pesquisarem por          │
│      produtos/serviços como o seu"                       │
│     Exemplo: Resultados do Google Search                │
│                                                          │
│  ○ Rede de Display (DISPLAY)                            │
│     "Mostre anúncios visuais em milhões de sites,       │
│      vídeos e apps"                                      │
│     Exemplo: Banners em sites parceiros                 │
│                                                          │
│  ○ Vídeo (YouTube) - Em breve                           │
│     "Exiba anúncios em vídeo no YouTube"                │
│     ⚠️ Por enquanto, crie via Google Ads UI             │
└─────────────────────────────────────────────────────────┘
```

#### **Passo 2: Segmentação**

**Para SEARCH**:
```
┌─────────────────────────────────────────────────────────┐
│  Configure suas palavras-chave                           │
│                                                          │
│  Palavras-chave:                                         │
│  [marketing digital_______________] [+ Adicionar]       │
│  [consultoria marketing___________] [+ Adicionar]       │
│  [agência marketing_______________] [+ Adicionar]       │
│                                                          │
│  💡 Dica: Use frases que seus clientes pesquisariam     │
│                                                          │
│  Localização:                                            │
│  [Brasil ▼]  [+ Adicionar região]                       │
│                                                          │
│  Idioma:                                                 │
│  [Português ▼]                                           │
└─────────────────────────────────────────────────────────┘
```

**Para DISPLAY**:
```
┌─────────────────────────────────────────────────────────┐
│  Quem você quer alcançar?                                │
│                                                          │
│  Localização:                                            │
│  [Brasil ▼]                                              │
│                                                          │
│  Dados Demográficos:                                     │
│  Idade: De [18 ▼] até [65+ ▼]                           │
│  Gênero: [○ Todos  ○ Homens  ○ Mulheres]                │
│                                                          │
│  Interesses:                                             │
│  [Adicionar interesses...  🔍]                           │
│                                                          │
│  Tópicos:                                                │
│  [Selecionar tópicos de sites...  🔍]                    │
└─────────────────────────────────────────────────────────┘
```

#### **Passo 3: Orçamento e Lances**
```
┌─────────────────────────────────────────────────────────┐
│  Configure orçamento e estratégia de lances              │
│                                                          │
│  Nome da Campanha:                                       │
│  [Campanha Google Ads - Janeiro_____]                    │
│                                                          │
│  Orçamento Diário Médio:                                 │
│  R$ [150,00] por dia                                     │
│                                                          │
│  Estratégia de Lance (simplificada):                     │
│  ● Maximizar Conversões (recomendado)                   │
│     "O Google otimiza automaticamente para mais          │
│      conversões dentro do seu orçamento"                 │
│                                                          │
│  ○ CPA Desejado                                          │
│     Quanto você quer pagar por conversão: R$ [____]      │
│                                                          │
│  ○ ROAS Desejado                                         │
│     Retorno sobre investimento: [____]%                  │
│                                                          │
│  Período:                                                │
│  De [2025-01-20 📅] até [2025-02-20 📅]                 │
│                                                          │
│  [Voltar]                        [Criar Campanha ✓]     │
└─────────────────────────────────────────────────────────┘
```

**Parâmetros da API**:
```typescript
{
  name: "Campanha Google Ads - Janeiro",
  advertising_channel_type: "SEARCH", // ou "DISPLAY"
  campaign_budget: {
    amount_micros: 150000000, // R$ 150 em micros
    delivery_method: "STANDARD"
  },
  bidding_strategy_type: "MAXIMIZE_CONVERSIONS",
  // OU target_cpa: { target_cpa_micros: ... }
  // OU target_roas: { target_roas: ... }
  start_date: "2025-01-20",
  end_date: "2025-02-20",
  network_settings: {
    target_google_search: true,
    target_search_network: true
  }
}
```

---

### **FASE 4C: Criar Fluxo Simplificado LinkedIn Ads API**

**Objetivo**: Wizard de 3 passos focado em B2B e geração de leads

**Arquivos a criar**:
- `client/src/components/campaigns/wizards/LinkedInCampaignWizard.tsx`
- `client/src/components/campaigns/wizards/steps/LinkedInStep1Objective.tsx`
- `client/src/components/campaigns/wizards/steps/LinkedInStep2Targeting.tsx`
- `client/src/components/campaigns/wizards/steps/LinkedInStep3Budget.tsx`

**Estrutura do Wizard**:

#### **Passo 1: Objetivo B2B**
```
┌─────────────────────────────────────────────────────────┐
│  Qual o objetivo da sua campanha no LinkedIn?           │
│                                                          │
│  ○ Gerar Leads Qualificados (LEAD_GENERATION)           │
│     "Capture contatos profissionais e tomadores          │
│      de decisão"                                         │
│                                                          │
│  ○ Aumentar Conhecimento da Marca (BRAND_AWARENESS)     │
│     "Alcance profissionais relevantes para sua marca"   │
│                                                          │
│  ○ Aumentar Tráfego do Site (WEBSITE_VISITS)            │
│     "Leve profissionais para o seu site"                │
│                                                          │
│  ○ Promover Vídeo (VIDEO_VIEWS)                         │
│     "Aumente visualizações de conteúdo em vídeo"        │
│                                                          │
│  ○ Gerar Engajamento (ENGAGEMENT)                       │
│     "Mais curtidas, comentários e compartilhamentos"    │
│                                                          │
│  ○ Candidatos para Vagas (JOB_APPLICANTS)               │
│     "Promova suas oportunidades de emprego"             │
└─────────────────────────────────────────────────────────┘
```

#### **Passo 2: Segmentação B2B**
```
┌─────────────────────────────────────────────────────────┐
│  Defina seu público-alvo profissional                    │
│                                                          │
│  ● Localização                                           │
│    [Brasil ▼]  [+ Adicionar região]                     │
│                                                          │
│  ● Cargo/Função (Job Title)                              │
│    [CEO, Diretor, Gerente...  🔍]                        │
│    Ex: CEO, CTO, Diretor de Marketing                    │
│                                                          │
│  ● Senioridade                                           │
│    ☑️ C-Level  ☑️ Diretor  ☑️ Gerente  ☐ Júnior          │
│                                                          │
│  ● Setor/Indústria                                       │
│    [Selecionar setores...  🔍]                           │
│    Ex: Tecnologia, Marketing, Varejo                     │
│                                                          │
│  ● Tamanho da Empresa                                    │
│    ☑️ 1-10  ☑️ 11-50  ☑️ 51-200  ☑️ 201-500  ☑️ 500+     │
│                                                          │
│  ● Habilidades (opcional)                                │
│    [Adicionar habilidades...  🔍]                        │
│                                                          │
│  ⚠️ Audiência estimada: ~125.000 profissionais           │
│     (mínimo necessário: 300)                             │
└─────────────────────────────────────────────────────────┘
```

#### **Passo 3: Orçamento e Programação**
```
┌─────────────────────────────────────────────────────────┐
│  Configure orçamento e período                           │
│                                                          │
│  Nome da Campanha:                                       │
│  [Campanha LinkedIn B2B Q1_________]                     │
│                                                          │
│  Tipo de Orçamento:                                      │
│  ○ Orçamento Diário: R$ [200,00] por dia                │
│  ● Orçamento Total: R$ [6.000,00] para todo período     │
│                                                          │
│  Estratégia de Entrega (Pacing):                         │
│  ● Distribuição Uniforme ao Longo do Período            │
│     (LIFETIME - recomendado)                             │
│  ○ Acelerada (gasta mais rápido se possível)            │
│                                                          │
│  Período da Campanha:                                    │
│  De [2025-01-20 📅]                                      │
│  Até [2025-02-20 📅]                                     │
│                                                          │
│  ──────────────────────────────────────────              │
│  Estimativa de Alcance: ~125.000 profissionais          │
│  Investimento Total: R$ 6.000,00                         │
│                                                          │
│  [Voltar]                        [Criar Campanha ✓]     │
└─────────────────────────────────────────────────────────┘
```

**Parâmetros da API**:
```typescript
{
  name: "Campanha LinkedIn B2B Q1",
  objectiveType: "LEAD_GENERATION",
  account: "urn:li:sponsoredAccount:123456",
  totalBudget: {
    amount: "6000.00",
    currencyCode: "BRL"
  },
  // OU dailyBudget: { amount: "200.00", currencyCode: "BRL" }
  runSchedule: {
    start: 1737331200000, // timestamp
    end: 1739923200000    // timestamp
  },
  pacingStrategy: "LIFETIME",
  targetingCriteria: {
    include: {
      and: [
        { or: { "urn:li:geo:...": [...] } }, // Localizações
        { or: { "urn:li:seniority:...": [...] } }, // Senioridade
        { or: { "urn:li:industry:...": [...] } }, // Indústrias
        { or: { "urn:li:function:...": [...] } }  // Funções
      ]
    }
  }
}
```

---

### **FASE 4D: Criar Fluxo Simplificado TikTok Ads API**

**Objetivo**: Wizard de 3 passos focado em conteúdo viral e criativo

**Arquivos a criar**:
- `client/src/components/campaigns/wizards/TikTokCampaignWizard.tsx`
- `client/src/components/campaigns/wizards/steps/TikTokStep1Objective.tsx`
- `client/src/components/campaigns/wizards/steps/TikTokStep2Audience.tsx`
- `client/src/components/campaigns/wizards/steps/TikTokStep3Budget.tsx`

**Estrutura do Wizard**:

#### **Passo 1: Objetivo da Campanha**
```
┌─────────────────────────────────────────────────────────┐
│  Qual o objetivo da sua campanha no TikTok?             │
│                                                          │
│  ○ Alcance Máximo (REACH)                               │
│     "Mostre seu anúncio para o máximo de pessoas"       │
│                                                          │
│  ○ Visualizações de Vídeo (VIDEO_VIEWS)                 │
│     "Mais pessoas assistindo seus vídeos"               │
│                                                          │
│  ○ Gerar Tráfego (TRAFFIC)                              │
│     "Leve pessoas para seu site ou app"                 │
│                                                          │
│  ○ Gerar Conversões (CONVERSIONS)                       │
│     "Compras, cadastros ou outras ações no site"        │
│                                                          │
│  ○ Gerar Leads (LEAD_GENERATION)                        │
│     "Capture informações de contato diretamente         │
│      no TikTok"                                          │
│                                                          │
│  ○ Promover App (APP_PROMOTION)                         │
│     "Mais instalações do seu aplicativo"                │
└─────────────────────────────────────────────────────────┘
```

#### **Passo 2: Público-Alvo**
```
┌─────────────────────────────────────────────────────────┐
│  Quem você quer alcançar no TikTok?                      │
│                                                          │
│  ● Localização                                           │
│    [Brasil ▼]  [+ Adicionar região]                     │
│                                                          │
│  ● Idade                                                 │
│    De [18 ▼] até [50+ ▼]                                │
│    💡 TikTok: 60% dos usuários têm 18-34 anos            │
│                                                          │
│  ● Gênero                                                │
│    [○ Todos  ○ Homens  ○ Mulheres]                      │
│                                                          │
│  ● Idioma                                                │
│    [Português ▼]                                         │
│                                                          │
│  ● Interesses (opcional)                                 │
│    [Adicionar categorias de interesse...  🔍]           │
│    Ex: Moda, Beleza, Tech, Fitness, Games                │
│                                                          │
│  ● Comportamentos (opcional)                             │
│    ☑️ Criadores de conteúdo                              │
│    ☑️ Alta interação com vídeos                          │
│    ☑️ Compras online                                     │
│                                                          │
│  Audiência Estimada: ~2.5M - 3.5M usuários              │
└─────────────────────────────────────────────────────────┘
```

#### **Passo 3: Orçamento e Programação**
```
┌─────────────────────────────────────────────────────────┐
│  Configure orçamento e período                           │
│                                                          │
│  Nome da Campanha (até 512 caracteres):                  │
│  [Campanha TikTok Verão 2025___________]                 │
│                                                          │
│  Tipo de Orçamento:                                      │
│  ● Orçamento Diário: R$ [100,00] por dia                │
│  ○ Orçamento Total: R$ [____] para todo período         │
│                                                          │
│  💡 Orçamento mínimo TikTok: $20 USD/dia                 │
│                                                          │
│  Período da Campanha:                                    │
│  ○ Contínuo (roda até pausar)                           │
│  ● Programado                                            │
│    De [2025-01-20 📅] às [00:00]                        │
│    Até [2025-02-20 📅] às [23:59]                       │
│                                                          │
│  Otimização de Entrega:                                  │
│  ● Automática (deixe o TikTok otimizar)                 │
│  ○ Manual (você define lances e estratégias)            │
│                                                          │
│  ──────────────────────────────────────────              │
│  Alcance Estimado: ~2.8M usuários                        │
│  Investimento Total: R$ 3.100,00                         │
│                                                          │
│  [Voltar]                        [Criar Campanha ✓]     │
└─────────────────────────────────────────────────────────┘
```

**Parâmetros da API**:
```typescript
{
  advertiser_id: "1234567890",
  campaign_name: "Campanha TikTok Verão 2025",
  objective_type: "CONVERSIONS",
  budget_mode: "BUDGET_MODE_DAY", // ou BUDGET_MODE_TOTAL
  budget: 100.00,
  // Outras configurações automáticas ou simplificadas
}
```

---

### **FASE 4E: Criar Fluxo Simplificado YouTube (via Demand Gen)**

**Objetivo**: Wizard de 3 passos usando Demand Gen Campaigns (alternativa para YouTube)

**Arquivos a criar**:
- `client/src/components/campaigns/wizards/YouTubeDemandGenWizard.tsx`
- `client/src/components/campaigns/wizards/steps/YouTubeStep1Setup.tsx`
- `client/src/components/campaigns/wizards/steps/YouTubeStep2Audience.tsx`
- `client/src/components/campaigns/wizards/steps/YouTubeStep3Creative.tsx`

**Estrutura do Wizard**:

#### **Passo 1: Configuração Inicial**
```
┌─────────────────────────────────────────────────────────┐
│  Configure sua campanha de vídeo                         │
│                                                          │
│  ⚠️ IMPORTANTE: Campanhas de vídeo no YouTube são       │
│     criadas usando Demand Gen (Google Ads)               │
│                                                          │
│  Nome da Campanha:                                       │
│  [Campanha YouTube - Produto X______]                    │
│                                                          │
│  Objetivo:                                               │
│  ● Gerar Demanda (Demand Generation)                    │
│     "Alcance pessoas propensas a se interessar por      │
│      seus produtos/serviços via YouTube, Gmail,          │
│      Discovery"                                          │
│                                                          │
│  Tipo de Campanha:                                       │
│  ● Vídeo (YouTube TrueView, Bumper Ads, etc.)           │
│                                                          │
│  Formato de Anúncio:                                     │
│  ○ In-Stream Pulável (pode pular após 5 segundos)      │
│  ○ Bumper Ads (6 segundos, não pulável)                │
│  ○ Discovery (aparece em resultados de busca)           │
│                                                          │
│  [Avançar ➔]                                             │
└─────────────────────────────────────────────────────────┘
```

#### **Passo 2: Público-Alvo**
```
┌─────────────────────────────────────────────────────────┐
│  Defina quem verá seus anúncios                          │
│                                                          │
│  ● Localização                                           │
│    [Brasil ▼]  [+ Adicionar região]                     │
│                                                          │
│  ● Dados Demográficos                                    │
│    Idade: De [18 ▼] até [65+ ▼]                         │
│    Gênero: [○ Todos  ○ Homens  ○ Mulheres]              │
│    Situação Parental: [Todos ▼]                          │
│    Renda Familiar: [Todos ▼]                             │
│                                                          │
│  ● Interesses e Comportamentos                           │
│    [Adicionar interesses afins...  🔍]                   │
│    Ex: Tecnologia, Automóveis, Beleza                    │
│                                                          │
│  ● Palavras-chave (Contextual)                           │
│    [Adicionar palavras-chave...  🔍]                     │
│    Anúncios aparecem em vídeos relacionados              │
│                                                          │
│  ● Canais/Vídeos Específicos (opcional)                  │
│    [URL do canal ou vídeo________________]               │
│                                                          │
│  Alcance Estimado: ~1.2M - 1.8M usuários YouTube        │
│                                                          │
│  [◁ Voltar]                                [Avançar ➔]  │
└─────────────────────────────────────────────────────────┘
```

#### **Passo 3: Orçamento e Criativos**
```
┌─────────────────────────────────────────────────────────┐
│  Finalize com orçamento e vídeo                          │
│                                                          │
│  ● Orçamento                                             │
│    Orçamento Diário: R$ [150,00] por dia                │
│                                                          │
│  ● Estratégia de Lance                                   │
│    ○ CPV Máximo (Custo por Visualização): R$ [____]     │
│    ● CPM Desejado (Custo por Mil Impressões): R$ [25]   │
│    ○ Maximizar Conversões                               │
│                                                          │
│  ● Vídeo do Anúncio                                      │
│    URL do YouTube: [https://youtube.com/watch?v=___]     │
│                                                          │
│    💡 O vídeo precisa estar público ou não listado       │
│        no YouTube                                        │
│                                                          │
│  ● URL de Destino (opcional)                             │
│    [https://seusite.com.br_______________]               │
│                                                          │
│  ● Call-to-Action                                        │
│    [Saiba Mais ▼]                                        │
│    Opções: Saiba Mais, Comprar Agora, Cadastre-se       │
│                                                          │
│  Período:                                                │
│  De [2025-01-20 📅] até [2025-02-20 📅]                 │
│                                                          │
│  ──────────────────────────────────────────              │
│  Visualizações Estimadas: ~40.000 - 60.000              │
│  Investimento Total: R$ 4.650,00                         │
│                                                          │
│  [◁ Voltar]                    [Criar Campanha ✓]       │
└─────────────────────────────────────────────────────────┘
```

**Parâmetros da API (Demand Gen)**:
```typescript
{
  name: "Campanha YouTube - Produto X",
  advertising_channel_type: "DEMAND_GEN", // Novo tipo para Demand Gen
  campaign_budget: {
    amount_micros: 150000000 // R$ 150 em micros
  },
  bidding_strategy_type: "MAXIMIZE_CONVERSION_VALUE",
  // OU target_cpm: { target_cpm_micros: 25000000 }
  start_date: "2025-01-20",
  end_date: "2025-02-20",
  video_ad: {
    video_url: "https://youtube.com/watch?v=...",
    call_to_action: "LEARN_MORE",
    final_url: "https://seusite.com.br"
  }
}
```

**⚠️ Nota Importante**:
- Vídeo campaigns puras NÃO podem ser criadas via API
- Solução: Usar **Demand Gen Campaigns** que suporta vídeos no YouTube
- Alternativa: Exibir mensagem: "Para campanhas de vídeo tradicionais, acesse Google Ads UI"

---

### **FASE 5: Testes e Validação UX**

**Objetivo**: Garantir que usuários leigos consigam criar campanhas facilmente

**Checklist de Validação**:

#### **Testes de Usabilidade**:
- [ ] Usuário consegue entender cada passo sem ajuda externa?
- [ ] Textos e descrições estão em português claro e sem jargão técnico?
- [ ] Cada campo tem tooltip explicativo?
- [ ] Valores padrão/sugeridos estão preenchidos?
- [ ] Estimativas de alcance/resultados são exibidas?
- [ ] Validação de campos em tempo real funciona?
- [ ] Mensagens de erro são claras e acionáveis?

#### **Testes Funcionais**:
- [ ] Redes conectadas são buscadas corretamente da Home?
- [ ] Modal de seleção lista apenas redes conectadas?
- [ ] Cada wizard abre corretamente ao selecionar rede?
- [ ] Navegação entre passos funciona (Voltar/Avançar)?
- [ ] Criação de campanha chama API correta?
- [ ] Campanha criada aparece na lista?
- [ ] Stats são atualizadas após criação?

#### **Testes de Responsividade**:
- [ ] Wizards funcionam em mobile/tablet?
- [ ] Modal de seleção de rede é responsivo?
- [ ] Campos de formulário são mobile-friendly?

#### **Documentação**:
- [ ] Criar guia rápido "Como criar sua primeira campanha"
- [ ] Adicionar vídeo tutorial (opcional)
- [ ] FAQ com dúvidas comuns

---

## 🎨 COMPONENTES REUTILIZÁVEIS

Para acelerar o desenvolvimento, criar componentes genéricos:

### **1. BaseWizard**
Componente base com navegação de passos:
```tsx
<BaseWizard
  steps={[
    { title: "Objetivo", component: <Step1 /> },
    { title: "Público", component: <Step2 /> },
    { title: "Orçamento", component: <Step3 /> }
  ]}
  onComplete={(data) => createCampaign(data)}
/>
```

### **2. ObjectiveSelector**
Seletor de objetivos reutilizável:
```tsx
<ObjectiveSelector
  objectives={[
    { value: "SALES", label: "Aumentar Vendas", description: "..." },
    { value: "LEADS", label: "Gerar Leads", description: "..." }
  ]}
  onChange={(objective) => setObjective(objective)}
/>
```

### **3. AudienceTargeting**
Componente de segmentação de público:
```tsx
<AudienceTargeting
  platform="facebook" // ou "google", "linkedin", etc.
  onTargetingChange={(targeting) => setTargeting(targeting)}
/>
```

### **4. BudgetSchedule**
Configuração de orçamento e programação:
```tsx
<BudgetSchedule
  platform="tiktok"
  minDaily={20}
  currency="BRL"
  onBudgetChange={(budget) => setBudget(budget)}
/>
```

---

## 📊 ESTRUTURA DE DADOS

### **Campaigns Table Schema**
```typescript
interface Campaign {
  id: string;
  organizationId: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'google' | 'youtube';
  name: string;
  description?: string;
  objective: string; // SALES, LEADS, etc.
  status: 'active' | 'paused' | 'draft' | 'completed';

  // IDs das plataformas
  platformCampaignId?: string; // ID retornado pela API da plataforma

  // Orçamento
  budgetType: 'daily' | 'lifetime';
  budgetAmount: number;
  budgetCurrency: string;

  // Programação
  startDate?: Date;
  endDate?: Date;

  // Segmentação (JSON)
  targeting: Record<string, any>;

  // Stats (sincronizado periodicamente)
  stats?: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    ctr: number;
    cpc: number;
    cpm: number;
  };

  lastSyncAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🚀 PRIORIZAÇÃO DE IMPLEMENTAÇÃO

### **Sprint 1 (Alta Prioridade)**: Meta Ads (Instagram + Facebook)
- Maior volume de usuários
- API mais madura e documentada
- Essencial para validação do conceito

### **Sprint 2 (Alta Prioridade)**: Google Ads
- Segunda maior plataforma
- Search campaigns são muito demandadas

### **Sprint 3 (Média Prioridade)**: TikTok
- Crescimento explosivo
- Público jovem e engajado

### **Sprint 4 (Média Prioridade)**: LinkedIn
- Essencial para B2B
- Alta qualidade de leads

### **Sprint 5 (Baixa Prioridade)**: YouTube via Demand Gen
- Alternativa viável para vídeo campaigns
- Complementa Google Ads

---

## ✅ CRITÉRIOS DE SUCESSO

### **Métricas de Usabilidade**:
- [ ] 90% dos usuários testados criam campanha sem assistência
- [ ] Tempo médio para criar primeira campanha < 5 minutos
- [ ] Taxa de conclusão do wizard > 80%

### **Métricas Técnicas**:
- [ ] 100% das campanhas criadas via API são sincronizadas
- [ ] Latência de criação < 3 segundos
- [ ] Taxa de erro da API < 2%

### **Métricas de Negócio**:
- [ ] Aumento de 50% no número de campanhas ativas
- [ ] Redução de 70% no suporte relacionado a criação de campanhas
- [ ] NPS da funcionalidade > 8/10

---

## 📚 RECURSOS E DOCUMENTAÇÕES OFICIAIS

### **Meta Ads API (Instagram + Facebook)**
- Documentação: https://developers.facebook.com/docs/marketing-api/
- Versão atual: v24.0 (2024)
- Objetivos simplificados: https://developers.facebook.com/docs/marketing-api/campaign-structure/

### **Google Ads API**
- Documentação: https://developers.google.com/google-ads/api/docs/start
- Versão atual: v20
- Campaign Creation: https://developers.google.com/google-ads/api/docs/campaigns/create-campaigns

### **LinkedIn Ads API**
- Documentação: https://learn.microsoft.com/en-us/linkedin/marketing/
- Versão atual: 202410
- Campaign Management: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/account-structure/create-and-manage-campaigns

### **TikTok Ads API**
- Documentação: https://ads.tiktok.com/marketing_api/docs
- Business API Portal: https://business-api.tiktok.com/portal/docs

### **YouTube (via Google Ads Demand Gen)**
- Demand Gen Campaigns: https://developers.google.com/google-ads/api/docs/demand-gen/overview
- Video Ads limitation: https://developers.google.com/google-ads/api/docs/video/overview

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. **Aprovar o plano** e confirmar prioridades
2. **Iniciar FASE 1**: Atualizar header da página Campanhas
3. **Desenvolver FASE 2**: Sistema de integração com redes conectadas
4. **Prototipar FASE 3**: Modal de seleção de rede social
5. **Implementar FASE 4A**: Wizard Meta Ads (Instagram/Facebook)

---

**Última atualização**: 2025-01-18
**Versão do documento**: 1.0
**Autor**: Claude (Anthropic) + Marcus (Product Owner)
