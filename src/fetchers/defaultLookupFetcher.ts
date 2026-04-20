import { buildLookupQuery } from '../utils/buildLookupQuery'
import type { LookupFetcher, LookupResponse } from '../types/lookup'
import { resolveLookupHttpClient } from '../http-client'

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
    requestConfig?: Record<string, unknown>,
): LookupFetcher {
    return async (params) => {
        const query = buildLookupQuery(params)
        const endpoint = params.endpoint.replace(/\/$/, '')
        const url = `${endpoint}${query}`
        const httpClient = resolveLookupHttpClient()

        let json: unknown
        try {
            const response = await httpClient.get<LookupResponse>(url, {
                ...requestConfig,
                signal: params.signal,
                headers: {
                    Accept: 'application/json',
                    ...((requestConfig?.headers as Record<string, string | number | boolean> | undefined) ?? {}),
                },
            })
            json = response.data
        } catch (error) {
            if (typeof error === 'object' && error !== null) {
                const status = Number((error as { response?: { status?: number } }).response?.status)
                if (status) {
                    throw new Error(`Lookup isteği başarısız: HTTP ${status}`)
                }
            }

            throw error
        }

        if (!isLookupResponse(json)) {
            throw new Error('Lookup yanıtı beklenen formatta değil.')
        }

        return json
    }
}

export const defaultLookupFetcher: ReturnType<typeof createDefaultLookupFetcher> =
    createDefaultLookupFetcher()
