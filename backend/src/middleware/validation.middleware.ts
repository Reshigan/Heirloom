import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Validation middleware factory
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// Auth schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

// Family member schemas
export const createFamilyMemberSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    relationship: z.string().min(1).max(50),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    birthDate: z.string().datetime().optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  }),
});

export const updateFamilyMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    relationship: z.string().min(1).max(50).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    birthDate: z.string().datetime().optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  }),
});

// Memory schemas
export const createMemorySchema = z.object({
  body: z.object({
    type: z.enum(['PHOTO', 'VOICE', 'LETTER', 'VIDEO']),
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    recipientIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateMemorySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional().nullable(),
    recipientIds: z.array(z.string().uuid()).optional(),
  }),
});

// Letter schemas
export const createLetterSchema = z.object({
  body: z.object({
    title: z.string().max(200).optional(),
    salutation: z.string().max(200).optional(),
    body: z.string().min(1).max(50000),
    signature: z.string().max(200).optional(),
    deliveryTrigger: z.enum(['IMMEDIATE', 'SCHEDULED', 'POSTHUMOUS']),
    scheduledDate: z.string().datetime().optional().nullable(),
    recipientIds: z.array(z.string().uuid()).min(1),
  }),
});

export const updateLetterSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().max(200).optional().nullable(),
    salutation: z.string().max(200).optional().nullable(),
    body: z.string().min(1).max(50000).optional(),
    signature: z.string().max(200).optional().nullable(),
    deliveryTrigger: z.enum(['IMMEDIATE', 'SCHEDULED', 'POSTHUMOUS']).optional(),
    scheduledDate: z.string().datetime().optional().nullable(),
    recipientIds: z.array(z.string().uuid()).optional(),
  }),
});

// Voice recording schemas
export const createVoiceRecordingSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    duration: z.number().int().positive(),
    prompt: z.string().max(500).optional(),
    recipientIds: z.array(z.string().uuid()).optional(),
  }),
});

// Upload schemas
export const getUploadUrlSchema = z.object({
  body: z.object({
    filename: z.string().min(1).max(255),
    contentType: z.string().min(1).max(100),
    folder: z.enum(['memories', 'voice', 'avatars']),
  }),
});

// Settings schemas
export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    avatarUrl: z.string().url().optional().nullable(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }),
});

// Pagination schema
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

// ID param schema
export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});
