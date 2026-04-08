import { z } from 'zod';

const LoginResponseSchema = z.object({
  token: z.string(),
  tokenType: z.string(),
  expiresIn: z.number(),
  email: z.string(),
  roles: z.array(z.string()),
});

const CurrentUserResponseSchema = z.object({
  username: z.string(),
  roles: z.array(z.string()),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type CurrentUserResponse = z.infer<typeof CurrentUserResponseSchema>;

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Login failed.',
    );
  }

  return LoginResponseSchema.parse(payload);
}

export async function fetchCurrentUser(token: string): Promise<CurrentUserResponse> {
  const response = await fetch('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Failed to fetch current user.',
    );
  }

  return CurrentUserResponseSchema.parse(payload);
}
