import { buildLookupQuery } from '../utils/buildLookupQuery'
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
    requestInit?: Omit<RequestInit, 'signal' | 'body' | 'method'>,
): LookupFetcher {
    return async (params) => {
        const query = buildLookupQuery(params)
        const url = `${params.endpoint.replace(/\/$/, '')}${query}`

        const response = await fetch(url, {
            ...requestInit,
            method: 'GET',
            headers: {
                Accept: 'application/json',
                ...(requestInit?.headers ?? {}),
            },
            signal: params.signal,
        })

        if (!response.ok) {
            throw new Error(`Lookup isteği başarısız: HTTP ${response.status}`)
        }

        const json: unknown = await response.json()

        if (!isLookupResponse(json)) {
            throw new Error('Lookup yanıtı beklenen formatta değil.')
        }

        return json
    }
}

export const defaultLookupFetcher: ReturnType<typeof createDefaultLookupFetcher> =
    createDefaultLookupFetcher()
