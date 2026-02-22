import { z } from 'zod';
import * as applicationService from '../services/applicationService.js';
const createSchema = z.object({
    company: z.string().min(1),
    title: z.string().min(1),
    status: z.enum(['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']).optional(),
    location: z.string().optional(),
    notes: z.string().optional()
});
const listQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional(),
    status: z.enum(['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']).optional(),
    company: z.string().optional(),
    sortBy: z.enum(['createdAt', 'appliedDate', 'company', 'status', 'title']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
});
const adminListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional()
});
const updateSchema = z.object({
    company: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    status: z.enum(['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']).optional(),
    location: z.string().optional(),
    notes: z.string().optional()
}).refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });
export const createApplication = async (req, res) => {
    const data = createSchema.parse(req.body);
    const application = await applicationService.createApplication(req.user.id, data);
    res.status(201).json(application);
};
export const listApplications = async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const result = await applicationService.listApplications(req.user.id, query);
    res.json(result);
};
export const updateApplication = async (req, res) => {
    const data = updateSchema.parse(req.body);
    const applicationId = z.string().parse(req.params.id);
    const result = await applicationService.updateApplication(req.user.id, applicationId, data);
    res.json(result);
};
export const deleteApplication = async (req, res) => {
    const applicationId = z.string().parse(req.params.id);
    await applicationService.deleteApplication(req.user.id, applicationId);
    res.status(204).send();
};
export const analytics = async (req, res) => {
    const result = await applicationService.getAnalytics(req.user.id);
    res.json(result);
};
export const adminUsers = async (req, res) => {
    const query = adminListQuerySchema.parse(req.query);
    const result = await applicationService.listUsersForAdmin(query);
    res.json(result);
};
