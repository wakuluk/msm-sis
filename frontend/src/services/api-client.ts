import { getAccessToken } from '@/auth/auth-store';

type ResponseParser<TResponse> = {
  parse: (payload: unknown) => TResponse;
};

type ApiRequestArgs<TResponse> = {
  path: string;
  parser: ResponseParser<TResponse>;
  fallbackMessage: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  headers?: HeadersInit;
};

function getApiErrorMessage(payload: unknown, fallbackMessage: string): string {
  return typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof payload.message === 'string'
    ? payload.message
    : fallbackMessage;
}

function getAuthenticatedHeaders(headers?: HeadersInit, includeJsonContentType = false) {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Authorization', `Bearer ${accessToken}`);

  if (includeJsonContentType && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  return requestHeaders;
}

export async function apiRequest<TResponse>({
  path,
  parser,
  fallbackMessage,
  method = 'GET',
  body,
  signal,
  headers,
}: ApiRequestArgs<TResponse>): Promise<TResponse> {
  const response = await fetch(path, {
    method,
    headers: getAuthenticatedHeaders(headers, body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, fallbackMessage));
  }

  return parser.parse(payload);
}
