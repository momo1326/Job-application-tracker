import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import * as applicationService from '../services/applicationService.js';

const createSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']).optional(),
  location: z.string().optional(),
  notes: z.string().optional()
});

const updateSchema = z.object({
  company: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  status: z.enum(['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']).optional(),
  location: z.string().optional(),
  notes: z.string().optional()
}).refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

export const createApplication = async (req: AuthRequest, res: Response) => {
  const data = createSchema.parse(req.body);
  const application = await applicationService.createApplication(req.user!.id, data);
  res.status(201).json(application);
};

export const listApplications = async (req: AuthRequest, res: Response) => {
  const result = await applicationService.listApplications(req.user!.id, req.query);
  res.json(result);
};

export const updateApplication = async (req: AuthRequest, res: Response) => {
  const data = updateSchema.parse(req.body);
  const applicationId = z.string().parse(req.params.id);
  const result = await applicationService.updateApplication(req.user!.id, applicationId, data);
  res.json(result);
};

export const deleteApplication = async (req: AuthRequest, res: Response) => {
  const applicationId = z.string().parse(req.params.id);
  await applicationService.deleteApplication(req.user!.id, applicationId);
  res.status(204).send();
};

export const analytics = async (req: AuthRequest, res: Response) => {
  const result = await applicationService.getAnalytics(req.user!.id);
  res.json(result);
};

export const adminUsers = async (_req: Request, res: Response) => {
  res.json({ message: 'Admin dashboard endpoint placeholder' });
};
