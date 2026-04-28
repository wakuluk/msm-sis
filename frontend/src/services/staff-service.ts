import { getAccessToken } from '@/auth/auth-store';
import {
  StaffSearchResponseSchema,
  type StaffSearchResponse,
} from './schemas/staff-schemas';

export type SearchStaffRequest = {
  search?: string;
  page?: number;
  size?: number;
  signal?: AbortSignal;
};

export async function searchStaff({
  search,
  page = 0,
  size = 10,
  signal,
}: SearchStaffRequest): Promise<StaffSearchResponse> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  const queryParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (search?.trim()) {
    queryParams.set('search', search.trim());
  }

  const response = await fetch(`/api/staff/search?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string' ? payload.message : 'Failed to search staff.'
    );
  }

  return StaffSearchResponseSchema.parse(payload);
}
