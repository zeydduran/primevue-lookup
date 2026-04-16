import type { LookupFetcherParams } from '../types/lookup'

/**
 * Laravel uyumlu query string (`selected[]`, `filters[key]`).
 */
export function buildLookupQuery(params: LookupFetcherParams): string {
    const searchParams = new URLSearchParams()

    if (params.q !== undefined && params.q !== '') {
        searchParams.set('q', params.q)
    }

    if (params.page !== undefined) {
        searchParams.set('page', String(params.page))
    }

    if (params.perPage !== undefined) {
        searchParams.set('per_page', String(params.perPage))
    }

    for (const value of params.selected ?? []) {
        searchParams.append('selected[]', String(value))
    }

    for (const value of params.exclude ?? []) {
        searchParams.append('exclude[]', String(value))
    }

    if (params.filters !== undefined) {
        for (const [key, raw] of Object.entries(params.filters)) {
            if (raw === undefined || raw === null) {
                continue
            }

            if (typeof raw === 'object') {
                continue
            }

            searchParams.set(`filters[${key}]`, String(raw))
        }
    }

    const qs = searchParams.toString()

    return qs === '' ? '' : `?${qs}`
}
