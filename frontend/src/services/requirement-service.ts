import { getAccessToken } from '@/auth/auth-store';
import {
  CreateRequirementRequestSchema,
  PatchRequirementRequestSchema,
  ProgramVersionRequirementResponseSchema,
  RequirementDetailResponseSchema,
  RequirementSearchResponseSchema,
  RequirementSearchResultResponseSchema,
  type CreateRequirementRequest,
  type PatchRequirementRequest,
  type ProgramVersionRequirementResponse,
  type RequirementDetailResponse,
  type RequirementSearchResponse,
  type RequirementSearchResultResponse,
} from './schemas/program-schemas';

export type SearchRequirementsRequest = {
  code?: string;
  name?: string;
  requirementType?: string;
  page?: number;
  size?: number;
  signal?: AbortSignal;
};

export type GetRequirementDetailRequest = {
  requirementId: number;
  signal?: AbortSignal;
};

export type AttachProgramVersionRequirementRequest = {
  programVersionId: number;
  requirementId: number;
  sortOrder?: number | null;
  notes?: string | null;
};

export type PatchProgramVersionRequirementRequest = {
  programVersionRequirementId: number;
  sortOrder?: number | null;
  notes?: string | null;
};

export type RemoveProgramVersionRequirementRequest = {
  programVersionRequirementId: number;
};

export type CreateRequirementServiceRequest = {
  request: CreateRequirementRequest;
};

export type PatchRequirementServiceRequest = {
  requirementId: number;
  request: PatchRequirementRequest;
};

function appendTrimmedQueryParam(queryParams: URLSearchParams, key: string, value?: string) {
  if (value && value.trim()) {
    queryParams.set(key, value.trim());
  }
}

async function readJsonResponse(response: Response, fallbackMessage: string) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(typeof payload?.message === 'string' ? payload.message : fallbackMessage);
  }

  return payload;
}

function getAuthenticatedHeaders() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated.');
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function searchRequirements({
  code,
  name,
  requirementType,
  page = 0,
  size = 25,
  signal,
}: SearchRequirementsRequest): Promise<RequirementSearchResponse> {
  const queryParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  appendTrimmedQueryParam(queryParams, 'code', code);
  appendTrimmedQueryParam(queryParams, 'name', name);
  appendTrimmedQueryParam(queryParams, 'requirementType', requirementType);

  const response = await fetch(`/api/requirements/search?${queryParams.toString()}`, {
    headers: getAuthenticatedHeaders(),
    signal,
  });

  return RequirementSearchResponseSchema.parse(
    await readJsonResponse(response, 'Failed to search requirements.')
  );
}

export async function getRequirementDetail({
  requirementId,
  signal,
}: GetRequirementDetailRequest): Promise<RequirementDetailResponse> {
  const response = await fetch(`/api/requirements/${requirementId}`, {
    headers: getAuthenticatedHeaders(),
    signal,
  });

  return RequirementDetailResponseSchema.parse(
    await readJsonResponse(response, 'Failed to load requirement detail.')
  );
}

export async function createRequirement({
  request,
}: CreateRequirementServiceRequest): Promise<RequirementSearchResultResponse> {
  const parsedRequest = CreateRequirementRequestSchema.parse(request);

  const response = await fetch('/api/requirements', {
    method: 'POST',
    headers: {
      ...getAuthenticatedHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parsedRequest),
  });

  return RequirementSearchResultResponseSchema.parse(
    await readJsonResponse(response, 'Failed to create requirement.')
  );
}

export async function patchRequirement({
  requirementId,
  request,
}: PatchRequirementServiceRequest): Promise<RequirementSearchResultResponse> {
  const parsedRequest = PatchRequirementRequestSchema.parse(request);

  const response = await fetch(`/api/requirements/${requirementId}`, {
    method: 'PATCH',
    headers: {
      ...getAuthenticatedHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parsedRequest),
  });

  return RequirementSearchResultResponseSchema.parse(
    await readJsonResponse(response, 'Failed to update requirement.')
  );
}

export async function attachProgramVersionRequirement({
  programVersionId,
  requirementId,
  sortOrder,
  notes,
}: AttachProgramVersionRequirementRequest): Promise<ProgramVersionRequirementResponse> {
  const response = await fetch(`/api/program-versions/${programVersionId}/requirements`, {
    method: 'POST',
    headers: {
      ...getAuthenticatedHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requirementId,
      sortOrder,
      notes,
    }),
  });

  return ProgramVersionRequirementResponseSchema.parse(
    await readJsonResponse(response, 'Failed to attach requirement.')
  );
}

export async function patchProgramVersionRequirement({
  programVersionRequirementId,
  sortOrder,
  notes,
}: PatchProgramVersionRequirementRequest): Promise<ProgramVersionRequirementResponse> {
  const response = await fetch(`/api/program-version-requirements/${programVersionRequirementId}`, {
    method: 'PATCH',
    headers: {
      ...getAuthenticatedHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sortOrder,
      notes,
    }),
  });

  return ProgramVersionRequirementResponseSchema.parse(
    await readJsonResponse(response, 'Failed to update requirement assignment.')
  );
}

export async function removeProgramVersionRequirement({
  programVersionRequirementId,
}: RemoveProgramVersionRequirementRequest): Promise<void> {
  const response = await fetch(`/api/program-version-requirements/${programVersionRequirementId}`, {
    method: 'DELETE',
    headers: getAuthenticatedHeaders(),
  });

  await readJsonResponse(response, 'Failed to remove requirement from version.');
}
