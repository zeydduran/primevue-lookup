import { buildLookupQuery } from '../utils/buildLookupQuery'
import { resolveLookupHttpClient } from '../http-client'
import type { LookupFetcher, LookupResponse } from '../types/lookup'

function isLookupResponse(value: unknown): value is LookupResponse {
    if (value === null || typeof value !== 'object') {
        return false
    }

    if (!('data' in value) || !('pagination' in value)) {
        return false
    }

    return Array.isArray((value as LookupResponse).data)
}

export function createDefaultLookupFetcher(
    requestInit?: Record<string, unknown>,
): LookupFetcher {
    return async (params) => {
        const query = buildLookupQuery(params)
        const path = `${params.endpoint.replace(/^\//, '')}${query}`
        const client = resolveLookupHttpClient()
        const response = await client.get<LookupResponse>(path, {
            ...requestInit,
            signal: params.signal,
        })
        const json: unknown = response.data

        if (!isLookupResponse(json)) {
            throw new Error('Lookup yanıtı beklenen formatta değil.')
        }

        return json
    }
}

export const defaultLookupFetcher: ReturnType<typeof createDefaultLookupFetcher> =
    createDefaultLookupFetcher()
