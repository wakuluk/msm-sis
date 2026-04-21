import { apiRequest } from './api-client';
import { CatalogSearchReferenceOptionsResponseSchema, type CatalogSearchReferenceOptionsResponse } from './schemas/reference-schemas';

type ReferenceLoaderOptions = {
  forceRefresh?: boolean;
};

type ResponseParser<TResponse> = {
  parse: (payload: unknown) => TResponse;
};

function createCachedReferenceLoader<TResponse>({
  path,
  parser,
  fallbackMessage,
}: {
  path: string;
  parser: ResponseParser<TResponse>;
  fallbackMessage: string;
}) {
  let cachedResponse: TResponse | null = null;
  let inFlightPromise: Promise<TResponse> | null = null;

  return async (options?: ReferenceLoaderOptions): Promise<TResponse> => {
    if (!options?.forceRefresh && cachedResponse) {
      return cachedResponse;
    }

    if (!options?.forceRefresh && inFlightPromise) {
      return inFlightPromise;
    }

    const requestPromise = apiRequest({
      path,
      parser,
      fallbackMessage,
    }).then((response) => {
      cachedResponse = response;
      return response;
    });

    inFlightPromise = requestPromise;

    try {
      return await requestPromise;
    } finally {
      inFlightPromise = null;
    }
  };
}

export const getPublicCatalogSearchReferenceOptions =
  createCachedReferenceLoader<CatalogSearchReferenceOptionsResponse>({
    path: '/api/reference/catalog-search-options',
    parser: CatalogSearchReferenceOptionsResponseSchema,
    fallbackMessage: 'Failed to load catalog search reference options.',
  });

export const getAdvancedCatalogSearchReferenceOptions =
  createCachedReferenceLoader<CatalogSearchReferenceOptionsResponse>({
    path: '/api/reference/catalog-advanced-search-options',
    parser: CatalogSearchReferenceOptionsResponseSchema,
    fallbackMessage: 'Failed to load catalog search reference options.',
  });

export async function getCatalogSearchReferenceOptions(options?: {
  forceRefresh?: boolean;
}): Promise<CatalogSearchReferenceOptionsResponse> {
  return getPublicCatalogSearchReferenceOptions(options);
}
