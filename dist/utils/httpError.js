export class HttpError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
    }
}
export const badRequest = (message) => new HttpError(400, message);
export const unauthorized = (message) => new HttpError(401, message);
export const forbidden = (message) => new HttpError(403, message);
export const notFound = (message) => new HttpError(404, message);
export const conflict = (message) => new HttpError(409, message);
