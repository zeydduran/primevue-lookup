import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
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
    axiosConfig?: Omit<AxiosRequestConfig, 'url' | 'method' | 'params' | 'signal'>,
): LookupFetcher {
    return async (params) => {
        const query = buildLookupQuery(params)
        const endpoint = params.endpoint.replace(/\/$/, '')
        const url = `${endpoint}${query}`

        let json: unknown
        try {
            const response = await axios.get<LookupResponse>(url, {
                ...axiosConfig,
                signal: params.signal,
                headers: {
                    Accept: 'application/json',
                    ...(axiosConfig?.headers ?? {}),
                },
            })
            json = response.data
        } catch (error) {
            if (error instanceof AxiosError) {
                const status = error.response?.status
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
