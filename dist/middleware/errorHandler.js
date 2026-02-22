import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';
export const errorHandler = (err, _req, res, _next) => {
    console.error(err);
    if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ message: err.message });
    }
    if (err instanceof ZodError) {
        return res.status(400).json({
            message: 'Validation error',
            errors: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
        });
    }
    return res.status(500).json({ message: err.message || 'Internal server error' });
};
