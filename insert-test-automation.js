// insert-test-automation.js
// Inserir automação de teste diretamente no banco

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function insertTestAutomation() {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco\n');

    // Buscar organização e usuário
    const org = await client.query(`
      SELECT id FROM organizations WHERE slug = 'admin-test-org' LIMIT 1
    `);

    const user = await client.query(`
      SELECT id FROM users WHERE email = 'test-automation@automation.global' LIMIT 1
    `);

    if (org.rows.length === 0 || user.rows.length === 0) {
      console.error('❌ Organização ou usuário não encontrado');
      return;
    }

    const organizationId = org.rows[0].id;
    const userId = user.rows[0].id;

    console.log(`🏢 Organization ID: ${organizationId}`);
    console.log(`👤 User ID: ${userId}\n`);

    // Verificar se já existe
    const existing = await client.query(`
      SELECT id FROM automations
      WHERE organization_id = $1
      AND name = 'Automação de Conteúdo - Demo'
    `, [organizationId]);

    if (existing.rows.length > 0) {
      console.log('⚠️  Automação já existe, pulando criação...');
      console.log(`🆔 ID: ${existing.rows[0].id}\n`);
    } else {
      // Inserir automação
      const result = await client.query(`
        INSERT INTO automations (
          organization_id,
          name,
          description,
          type,
          status,
          config,
          schedule_enabled,
          schedule_config,
          is_active,
          created_by
        ) VALUES (
          $1,
          'Automação de Conteúdo - Demo',
          'Gera posts automaticamente para redes sociais usando IA',
          'content',
          'active',
          $2::jsonb,
          true,
          $3::jsonb,
          true,
          $4
        )
        RETURNING id, name, type, status, is_active
      `, [
        organizationId,
        JSON.stringify({
          platforms: ['facebook', 'instagram', 'linkedin'],
          frequency: 'daily',
          useAI: true,
          generateImages: true,
          tone: 'professional',
          postTime: '09:00'
        }),
        JSON.stringify({
          type: 'cron',
          value: '0 9 * * *',
          timezone: 'America/Sao_Paulo'
        }),
        userId
      ]);

      console.log('✅ Automação criada com sucesso!');
      console.log(`🆔 ID: ${result.rows[0].id}`);
      console.log(`📝 Nome: ${result.rows[0].name}`);
      console.log(`🎯 Tipo: ${result.rows[0].type}`);
      console.log(`📊 Status: ${result.rows[0].status}`);
      console.log(`⚡ Ativa: ${result.rows[0].is_active}\n`);
    }

    // Inserir mais 2 automações para variedade
    const automations = [
      {
        name: 'E-mail Marketing Semanal',
        description: 'Envia newsletter semanal automaticamente',
        type: 'email',
        status: 'active',
        config: {
          recipients: 'subscribers',
          template: 'newsletter',
          includeLatestPosts: true,
          day: 'monday',
          time: '08:00'
        }
      },
      {
        name: 'Nutrição de Leads - LinkedIn',
        description: 'Campanha automática de nutrição de leads no LinkedIn',
        type: 'leads',
        status: 'configuring',
        config: {
          platform: 'linkedin',
          targetAudience: 'B2B',
          messageSequence: 3,
          intervalDays: 3
        }
      }
    ];

    for (const auto of automations) {
      const exists = await client.query(`
        SELECT id FROM automations
        WHERE organization_id = $1 AND name = $2
      `, [organizationId, auto.name]);

      if (exists.rows.length === 0) {
        await client.query(`
          INSERT INTO automations (
            organization_id,
            name,
            description,
            type,
            status,
            config,
            created_by,
            is_active
          ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
        `, [
          organizationId,
          auto.name,
          auto.description,
          auto.type,
          auto.status,
          JSON.stringify(auto.config),
          userId,
          auto.status === 'active'
        ]);

        console.log(`✅ ${auto.name} criada`);
      } else {
        console.log(`⚠️  ${auto.name} já existe`);
      }
    }

    // Listar todas
    console.log('\n📊 Automações na organização:');
    const all = await client.query(`
      SELECT id, name, type, status, is_active, created_at
      FROM automations
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `, [organizationId]);

    all.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. ${row.name}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Tipo: ${row.type} | Status: ${row.status} | Ativa: ${row.is_active}`);
      console.log(`   Criado: ${new Date(row.created_at).toLocaleString('pt-BR')}`);
    });

    console.log('\n\n✅ Setup completo!');
    console.log('📍 Acesse: http://localhost:5173/app/automation-builder');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

insertTestAutomation();
