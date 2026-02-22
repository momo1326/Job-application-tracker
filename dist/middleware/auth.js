import { verifyAccessToken } from '../utils/tokens.js';
export const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const payload = verifyAccessToken(authHeader.split(' ')[1]);
        req.user = { id: payload.sub, role: payload.role };
        return next();
    }
    catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
export const requireRole = (role) => (req, res, next) => {
    if (!req.user || req.user.role !== role) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
};
