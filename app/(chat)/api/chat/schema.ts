import { z } from 'zod';
import { securitySchemas } from '@/lib/security';

const textPartSchema = z.object({
  text: securitySchemas.chatMessage,
  type: z.enum(['text']),
});

export const postRequestBodySchema = z.object({
  id: securitySchemas.uuid,
  message: z.object({
    id: securitySchemas.uuid,
    createdAt: z.coerce.date(),
    role: z.enum(['user']),
    content: securitySchemas.chatMessage,
    parts: z.array(textPartSchema),
    experimental_attachments: z
      .array(
        z.object({
          url: securitySchemas.url,
          name: z.string().min(1).max(255).refine((name) => {
            // Additional filename validation
            const suspiciousPatterns = [
              /\.\./,  // Directory traversal
              /[<>:"|?*]/,  // Invalid filename characters
              /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,  // Reserved Windows names
            ];
            return !suspiciousPatterns.some(pattern => pattern.test(name));
          }, 'Filename contains invalid characters'),
          contentType: z.enum(['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp']),
        }),
      )
      .optional(),
  }),
  selectedChatModel: z.enum(['chat-model', 'chat-model-reasoning']),
  selectedVisibilityType: z.enum(['public', 'private']),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
