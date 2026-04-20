export interface LookupHttpRequestConfig {
    params?: Record<string, unknown>;
    headers?: Record<string, string | number | boolean>;
    responseType?: 'json' | 'blob' | 'arraybuffer' | string;
    signal?: AbortSignal;
    [key: string]: unknown;
}

export interface LookupHttpResponse<T = unknown> {
    data: T;
    headers?: Record<string, string | string[] | undefined>;
}

export interface LookupHttpClient {
    get<T = unknown>(url: string, config?: LookupHttpRequestConfig): Promise<LookupHttpResponse<T>>;
}

interface HttpClientStore {
    __ZYD_LABS_LOOKUP_HTTP_CLIENT__?: LookupHttpClient | null;
}

const httpClientStore = globalThis as HttpClientStore;
const STORE_KEY = '__ZYD_LABS_LOOKUP_HTTP_CLIENT__';

export function registerLookupHttpClient(client: LookupHttpClient): void {
    httpClientStore[STORE_KEY] = client;
}

export function resolveLookupHttpClient(): LookupHttpClient {
    const client = httpClientStore[STORE_KEY];
    if (!client) {
        throw new Error('Lookup HTTP istemcisi kaydedilmeden kullanılamaz.');
    }

    return client;
}

export function hasLookupHttpClient(): boolean {
    return Boolean(httpClientStore[STORE_KEY]);
}

export function resetLookupHttpClient(): void {
    httpClientStore[STORE_KEY] = null;
}
