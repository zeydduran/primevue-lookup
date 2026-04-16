export type LookupPrimitive = string | number

export interface LookupOption {
    value: LookupPrimitive
    label: string
    meta?: Record<string, unknown>
}

export interface LookupResponse {
    data: LookupOption[]
    pagination: {
        page: number
        per_page: number
        has_more: boolean
        total?: number | null
    }
}

export type LookupFetcherParams = {
    endpoint: string
    q?: string
    page?: number
    perPage?: number
    selected?: LookupPrimitive[]
    exclude?: LookupPrimitive[]
    filters?: Record<string, unknown>
    signal?: AbortSignal
}

export type LookupFetcher = (params: LookupFetcherParams) => Promise<LookupResponse>
