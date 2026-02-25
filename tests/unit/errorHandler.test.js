/**
 * Error Handler Middleware Tests
 */

const { AppError, notFoundHandler, errorHandler, asyncHandler } = require('../../src/bridge/middleware/errorHandler');

describe('Error Handler Middleware', () => {
    describe('AppError', () => {
        it('should create error with default status code', () => {
            const error = new AppError('Test error');
            
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(500);
            expect(error.isOperational).toBe(true);
            expect(error.details).toBeNull();
        });

        it('should create error with custom status code', () => {
            const error = new AppError('Not found', 404);
            
            expect(error.message).toBe('Not found');
            expect(error.statusCode).toBe(404);
        });

        it('should create error with details', () => {
            const details = { field: 'email', issue: 'invalid format' };
            const error = new AppError('Validation failed', 400, details);
            
            expect(error.message).toBe('Validation failed');
            expect(error.statusCode).toBe(400);
            expect(error.details).toEqual(details);
        });

        it('should capture stack trace', () => {
            const error = new AppError('Test error');
            
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
        });
    });

    describe('notFoundHandler', () => {
        it('should create 404 error for GET request', () => {
            const req = {
                method: 'GET',
                path: '/api/nonexistent'
            };
            const res = {};
            const next = jest.fn();

            notFoundHandler(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            const error = next.mock.calls[0][0];
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(404);
            expect(error.message).toBe('Cannot GET /api/nonexistent');
            expect(error.details).toEqual({ method: 'GET', path: '/api/nonexistent' });
        });

        it('should create 404 error for POST request', () => {
            const req = {
                method: 'POST',
                path: '/api/unknown'
            };
            const res = {};
            const next = jest.fn();

            notFoundHandler(req, res, next);

            const error = next.mock.calls[0][0];
            expect(error.message).toBe('Cannot POST /api/unknown');
            expect(error.statusCode).toBe(404);
        });
    });

    describe('asyncHandler', () => {
        it('should handle successful async function', async () => {
            const req = {};
            const res = { json: jest.fn() };
            const next = jest.fn();

            const handler = asyncHandler(async (req, res) => {
                res.json({ success: true });
            });

            await handler(req, res, next);

            expect(res.json).toHaveBeenCalledWith({ success: true });
            expect(next).not.toHaveBeenCalled();
        });

        it('should catch and forward errors', async () => {
            const req = {};
            const res = {};
            const next = jest.fn();
            const error = new Error('Async error');

            const handler = asyncHandler(async () => {
                throw error;
            });

            await handler(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });

        it('should catch AppError and forward it', async () => {
            const req = {};
            const res = {};
            const next = jest.fn();
            const error = new AppError('Validation failed', 400);

            const handler = asyncHandler(async () => {
                throw error;
            });

            await handler(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            const forwardedError = next.mock.calls[0][0];
            expect(forwardedError).toBeInstanceOf(AppError);
            expect(forwardedError.statusCode).toBe(400);
        });
    });

    describe('errorHandler', () => {
        let req, res, next;

        beforeEach(() => {
            req = {
                method: 'GET',
                path: '/api/test',
                ip: '127.0.0.1',
                user: { sub: 'user123' }
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            next = jest.fn();
            
            // Store original NODE_ENV
            process.env.NODE_ENV = 'test';
        });

        it('should handle AppError with custom status code', () => {
            const error = new AppError('Not found', 404);
            
            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.error).toBe('Not found');
            expect(response.statusCode).toBe(404);
        });

        it('should default to 500 for errors without status code', () => {
            const error = new Error('Generic error');
            
            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            const response = res.json.mock.calls[0][0];
            expect(response.statusCode).toBe(500);
        });

        it('should include stack trace in test environment', () => {
            const error = new Error('Test error');
            error.statusCode = 500;
            
            errorHandler(error, req, res, next);

            const response = res.json.mock.calls[0][0];
            expect(response.stack).toBeDefined();
        });

        it('should include operational error details', () => {
            const details = { field: 'email' };
            const error = new AppError('Validation error', 400, details);
            
            errorHandler(error, req, res, next);

            const response = res.json.mock.calls[0][0];
            expect(response.details).toEqual(details);
        });

        it('should handle ValidationError', () => {
            const error = new Error('Validation failed');
            error.name = 'ValidationError';
            error.details = { field: 'email' };
            
            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            const response = res.json.mock.calls[0][0];
            expect(response.error).toBe('Validation failed');
        });

        it('should handle JsonWebTokenError', () => {
            const error = new Error('Invalid token');
            error.name = 'JsonWebTokenError';
            
            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            const response = res.json.mock.calls[0][0];
            expect(response.error).toBe('Invalid token');
        });

        it('should handle TokenExpiredError', () => {
            const error = new Error('Token expired');
            error.name = 'TokenExpiredError';
            
            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            const response = res.json.mock.calls[0][0];
            expect(response.error).toBe('Token expired');
        });
    });
});
