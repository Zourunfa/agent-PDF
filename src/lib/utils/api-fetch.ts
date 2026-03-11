/**
 * 统一的 API 调用工具
 * 自动处理 401/403 错误，跳转到登录页
 */

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiRequestOptions {
  method?: RequestMethod;
  headers?: Record<string, string>;
  body?: any;
  skipAuthRedirect?: boolean; // 跳过自动跳转登录
  retries?: number; // 重试次数（默认 0）
  retryDelay?: number; // 重试延迟（毫秒，默认 1000）
}

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string | { code?: string; message?: string; details?: any };
  [key: string]: any;
}

/**
 * 统一的 fetch 包装函数
 * @param url API 路径
 * @param options 请求选项
 * @returns Promise<Response>
 */
export async function apiFetch(url: string, options: ApiRequestOptions = {}): Promise<Response> {
  const {
    method = 'GET',
    headers = {},
    body,
    skipAuthRedirect = false,
    retries = 0,
    retryDelay = 1000,
  } = options;

  // 默认 headers（FormData 除外）
  const isFormData = body instanceof FormData;
  const defaultHeaders: Record<string, string> = isFormData
    ? {} // FormData 不需要设置 Content-Type，让浏览器自动设置
    : { 'Content-Type': 'application/json' };

  // 合并 headers
  const finalHeaders = {
    ...defaultHeaders,
    ...headers,
  };

  // 构建请求配置
  const requestConfig: RequestInit = {
    method,
    headers: finalHeaders,
  };

  // 添加 body（如果是 GET/HEAD 请求则不添加）
  if (method !== 'GET' && method !== 'HEAD' && body) {
    if (isFormData) {
      // FormData 直接使用
      requestConfig.body = body;
    } else if (typeof body === 'object') {
      // JSON 对象序列化
      requestConfig.body = JSON.stringify(body);
    } else {
      // 其他类型（如字符串）直接使用
      requestConfig.body = body;
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, requestConfig);

      // 检查是否是 401/403 错误（未登录或无权限）
      if (!skipAuthRedirect && (response.status === 401 || response.status === 403)) {
        // 尝试读取错误消息
        let errorMessage = '请先登录';
        try {
          const data = await response.json();
          if (data.message) {
            errorMessage = data.message;
          }
        } catch {
          // 忽略 JSON 解析错误
        }

        // 保存当前页面路径，登录后返回
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register') {
            sessionStorage.setItem('returnAfterLogin', currentPath);
          }

          // 跳转到登录页
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
        throw new Error(errorMessage);
      }

      return response;
    } catch (error: any) {
      lastError = error;

      // 如果是我们主动抛出的错误（401/403），不重试
      if (error.message === '请先登录' || error.message?.includes('请先验证您的邮箱')) {
        throw error;
      }

      // 网络错误或服务器错误，可以重试
      // 如果还有重试次数，等待一段时间后重试
      if (attempt < retries) {
        // 指数退避：每次重试等待时间是上次的 2 倍
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // 重试次数用完，抛出最后的错误
      throw error;
    }
  }

  // 如果所有重试都失败，抛出最后的错误
  throw lastError || new Error('请求失败');
}

/**
 * GET 请求
 */
export async function apiGet<T = any>(
  url: string,
  options?: Omit<ApiRequestOptions, 'method'>
): Promise<ApiResponse<T>> {
  const response = await apiFetch(url, { ...options, method: 'GET' });
  const data = await response.json();

  // 统一错误消息格式
  if (!data.success && data.error) {
    if (typeof data.error === 'object' && data.error.message) {
      data.message = data.error.message;
    } else if (typeof data.error === 'string') {
      data.message = data.error;
    }
  }

  return data;
}

/**
 * POST 请求
 */
export async function apiPost<T = any>(
  url: string,
  body?: any,
  options?: Omit<ApiRequestOptions, 'method'>
): Promise<ApiResponse<T>> {
  const response = await apiFetch(url, { ...options, method: 'POST', body });
  const data = await response.json();

  // 统一错误消息格式
  if (!data.success && data.error) {
    if (typeof data.error === 'object' && data.error.message) {
      data.message = data.error.message;
    } else if (typeof data.error === 'string') {
      data.message = data.error;
    }
  }

  return data;
}

/**
 * PUT 请求
 */
export async function apiPut<T = any>(
  url: string,
  body?: any,
  options?: Omit<ApiRequestOptions, 'method'>
): Promise<ApiResponse<T>> {
  const response = await apiFetch(url, { ...options, method: 'PUT', body });
  const data = await response.json();

  // 统一错误消息格式
  if (!data.success && data.error) {
    if (typeof data.error === 'object' && data.error.message) {
      data.message = data.error.message;
    } else if (typeof data.error === 'string') {
      data.message = data.error;
    }
  }

  return data;
}

/**
 * DELETE 请求
 */
export async function apiDelete<T = any>(
  url: string,
  options?: Omit<ApiRequestOptions, 'method'>
): Promise<ApiResponse<T>> {
  const response = await apiFetch(url, { ...options, method: 'DELETE' });
  const data = await response.json();
  return data;
}
