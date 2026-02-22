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

export const createApplication = async (req: AuthRequest, res: Response) => {
  const data = createSchema.parse(req.body);
  const application = await applicationService.createApplication(req.user!.id, data);
  res.status(201).json(application);
};

export const listApplications = async (req: AuthRequest, res: Response) => {
  const result = await applicationService.listApplications(req.user!.id, req.query);
  res.json(result);
};

export const analytics = async (req: AuthRequest, res: Response) => {
  const result = await applicationService.getAnalytics(req.user!.id);
  res.json(result);
};

export const adminUsers = async (_req: Request, res: Response) => {
  res.json({ message: 'Admin dashboard endpoint placeholder' });
};
