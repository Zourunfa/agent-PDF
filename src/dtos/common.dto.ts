import { z } from 'zod';

/**
 * 分页参数 Schema
 */
export const PaginationSchema = z.object({
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(50),
  offset: z.coerce
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset cannot be negative')
    .default(0),
});

export type PaginationDTO = z.infer<typeof PaginationSchema>;

/**
 * 排序参数 Schema
 */
export const SortSchema = z.object({
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SortDTO = z.infer<typeof SortSchema>;

/**
 * 分页 + 排序组合 Schema
 */
export const PaginationWithSortSchema = PaginationSchema.merge(SortSchema);

export type PaginationWithSortDTO = z.infer<typeof PaginationWithSortSchema>;

/**
 * ID 参数 Schema
 */
export const IdSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export type IdDTO = z.infer<typeof IdSchema>;

/**
 * 空响应 Schema
 */
export const EmptySchema = z.object({});

export type EmptyDTO = z.infer<typeof EmptySchema>;

/**
 * 从 URL 搜索参数解析分页参数
 */
export function parsePaginationFromSearchParams(
  searchParams: URLSearchParams
): PaginationDTO {
  return PaginationSchema.parse({
    limit: searchParams.get('limit') || undefined,
    offset: searchParams.get('offset') || undefined,
  });
}

/**
 * 从 URL 搜索参数解析分页 + 排序参数
 */
export function parsePaginationWithSortFromSearchParams(
  searchParams: URLSearchParams,
  allowedSortFields: string[] = ['createdAt', 'updatedAt']
): PaginationWithSortDTO {
  const sortBy = searchParams.get('sortBy') || undefined;

  // 验证 sortBy 是否在允许的字段列表中
  if (sortBy && !allowedSortFields.includes(sortBy)) {
    throw new Error(`Invalid sortBy field: ${sortBy}. Allowed fields: ${allowedSortFields.join(', ')}`);
  }

  return PaginationWithSortSchema.parse({
    limit: searchParams.get('limit') || undefined,
    offset: searchParams.get('offset') || undefined,
    sortBy,
    sortOrder: searchParams.get('sortOrder') || undefined,
  });
}
