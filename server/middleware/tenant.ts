import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { storage } from '../storage';

export interface TenantRequest extends AuthenticatedRequest {
  organization?: {
    id: string;
    name: string;
    type: string;
    subscriptionPlan: string;
    settings: any;
  };
}

export async function loadOrganizationContext(
  req: TenantRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    // Skip if no organization ID in user context
    if (!req.user?.organizationId) {
      return next();
    }

    // Load organization data
    const organization = await storage.getOrganization(req.user.organizationId);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    if (!organization.isActive) {
      return res.status(403).json({ message: 'Organization is inactive' });
    }

    // Attach organization to request
    req.organization = {
      id: organization.id,
      name: organization.name,
      type: organization.type,
      subscriptionPlan: organization.subscriptionPlan,
      settings: organization.settings as any,
    };

    next();
  } catch (error) {
    res.status(500).json({ message: 'Failed to load organization context', error: error.message });
  }
}

export function requireActiveOrganization(req: TenantRequest, res: Response, next: NextFunction) {
  if (!req.organization) {
    return res.status(403).json({ message: 'Active organization required' });
  }
  next();
}

export function validateOrganizationAccess(req: TenantRequest, res: Response, next: NextFunction) {
  // Check if the organization ID in the URL matches the user's context
  const orgIdFromUrl = req.params.organizationId;
  
  if (orgIdFromUrl && req.user?.organizationId !== orgIdFromUrl) {
    return res.status(403).json({ message: 'Access denied to this organization' });
  }
  
  next();
}
