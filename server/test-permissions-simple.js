// server/test-permissions-simple.js
// Teste simplificado para validar permissões sem middleware complexo

const express = require('express');

const testRouter = express.Router();

// Aplicar middleware de auth básico
testRouter.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token' });
  }

  // Simular usuário autenticado (poderíamos validar o JWT aqui)
  req.user = {
    id: '1498af0e-ad20-42e4-96c2-d506a9c48784',
    email: 'auth-local@automation.global'
  };

  // Simular tenant context (super admin)
  req.tenant = {
    organizationId: 'bf10f43b-ec4b-46e3-b45c-16889c4f1505',
    role: 'super_admin',
    permissions: { '*': true }
  };

  next();
});

// Teste simples de permissão
testRouter.get('/test-permission/:action/:resource', (req, res) => {
  const { action, resource } = req.params;
  const { role, permissions } = req.tenant;

  // Super admin tem todas as permissões
  const hasPermission = role === 'super_admin' || permissions['*'] === true;

  res.json({
    success: true,
    message: 'Permission test completed',
    data: {
      user: req.user.email,
      role,
      action,
      resource,
      hasPermission,
      reason: hasPermission ? 'Super admin has all permissions' : 'Permission denied'
    }
  });
});

// Teste de organização específica
testRouter.get('/org/:organizationId', (req, res) => {
  const { organizationId } = req.params;
  const { role } = req.tenant;

  res.json({
    success: true,
    message: 'Organization access granted',
    data: {
      organizationId,
      role,
      hasAccess: role === 'super_admin',
      organization: {
        id: organizationId,
        name: 'Test Organization',
        type: 'marketing'
      }
    }
  });
});

// Teste de atualização de organização
testRouter.put('/org/:organizationId', (req, res) => {
  const { organizationId } = req.params;
  const { role } = req.tenant;

  if (role !== 'super_admin' && role !== 'org_owner' && role !== 'org_admin') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to update organization'
    });
  }

  res.json({
    success: true,
    message: 'Organization updated successfully',
    data: {
      organizationId,
      role,
      updatedBy: req.user.email,
      changes: req.body
    }
  });
});

// Teste de usuários da organização
testRouter.get('/org/:organizationId/users', (req, res) => {
  const { organizationId } = req.params;
  const { role } = req.tenant;

  res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      organizationId,
      role,
      users: [
        {
          id: req.user.id,
          email: req.user.email,
          role: 'super_admin'
        }
      ],
      total: 1
    }
  });
});

// Teste de criação de usuários
testRouter.post('/org/:organizationId/users', (req, res) => {
  const { organizationId } = req.params;
  const { role } = req.tenant;

  if (role !== 'super_admin' && role !== 'org_admin') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to add users'
    });
  }

  res.json({
    success: true,
    message: 'User added successfully',
    data: {
      organizationId,
      role,
      newUser: req.body,
      addedBy: req.user.email
    }
  });
});

module.exports = testRouter;