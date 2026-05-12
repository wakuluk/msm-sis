import { apiRequest } from './api-client';
import {
  AthleticSportListResponseSchema,
  AthleticSportResponseSchema,
  CreateAthleticSportRequestSchema,
  PatchAthleticSportRequestSchema,
  type AthleticSportListResponse,
  type AthleticSportResponse,
  type CreateAthleticSportRequest,
  type PatchAthleticSportRequest,
} from './schemas/athletics-schemas';

export type GetAthleticSportsRequest = {
  signal?: AbortSignal;
};

export type CreateAthleticSportServiceRequest = {
  request: CreateAthleticSportRequest;
  signal?: AbortSignal;
};

export type PatchAthleticSportServiceRequest = {
  athleticSportId: number;
  request: PatchAthleticSportRequest;
  signal?: AbortSignal;
};

export async function getAthleticSports({
  signal,
}: GetAthleticSportsRequest = {}): Promise<AthleticSportListResponse> {
  return apiRequest({
    path: '/api/athletics/sports',
    parser: AthleticSportListResponseSchema,
    fallbackMessage: 'Failed to load athletic sports.',
    signal,
  });
}

export async function createAthleticSport({
  request,
  signal,
}: CreateAthleticSportServiceRequest): Promise<AthleticSportResponse> {
  return apiRequest({
    path: '/api/athletics/sports',
    method: 'POST',
    body: CreateAthleticSportRequestSchema.parse(request),
    parser: AthleticSportResponseSchema,
    fallbackMessage: 'Failed to create athletic sport.',
    signal,
  });
}

export async function patchAthleticSport({
  athleticSportId,
  request,
  signal,
}: PatchAthleticSportServiceRequest): Promise<AthleticSportResponse> {
  return apiRequest({
    path: `/api/athletics/sports/${athleticSportId}`,
    method: 'PATCH',
    body: PatchAthleticSportRequestSchema.parse(request),
    parser: AthleticSportResponseSchema,
    fallbackMessage: 'Failed to update athletic sport.',
    signal,
  });
}
