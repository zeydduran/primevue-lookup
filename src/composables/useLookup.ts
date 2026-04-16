import { reactive, ref, shallowReadonly, shallowRef } from 'vue'
import { defaultLookupFetcher } from '../fetchers/defaultLookupFetcher'
import type { LookupFetcher, LookupFetcherParams, LookupOption, LookupPrimitive } from '../types/lookup'
import { mergeSelectedOptions } from '../utils/mergeSelectedOptions'

export type UseLookupConfig = {
    endpoint: string
    multiple: boolean
    perPage?: number
    debounceMs?: number
    filters?: () => Record<string, unknown> | undefined
    exclude?: () => LookupPrimitive[] | undefined
    fetcher?: LookupFetcher
}

export function useLookup(config: UseLookupConfig) {
    const fetcher = config.fetcher ?? defaultLookupFetcher
    const perPage = config.perPage ?? 20
    const debounceMs = config.debounceMs ?? 300

    const optionsRef = shallowRef<LookupOption[]>([])
    const loading = ref(false)
    const searchTerm = ref('')
    const selectedByValue = shallowRef(new Map<LookupPrimitive, LookupOption>())

    let debounceTimer: ReturnType<typeof setTimeout> | undefined
    let abortController: AbortController | undefined
    let requestSeq = 0

    const buildBaseParams = (): Pick<
        LookupFetcherParams,
        'endpoint' | 'perPage' | 'filters' | 'exclude'
    > => ({
        endpoint: config.endpoint,
        perPage,
        filters: config.filters?.(),
        exclude: config.exclude?.(),
    })

    const hydrateSelected = (rows: LookupOption[]): void => {
        const next = new Map(selectedByValue.value)

        for (const row of rows) {
            next.set(row.value, row)
        }

        selectedByValue.value = next
    }

    const fetchOptions = async (q: string): Promise<void> => {
        searchTerm.value = q

        if (debounceTimer !== undefined) {
            clearTimeout(debounceTimer)
        }

        debounceTimer = setTimeout(() => {
            void (async () => {
                abortController?.abort()
                abortController = new AbortController()
                const seq = ++requestSeq

                loading.value = true

                try {
                    const response = await fetcher({
                        ...buildBaseParams(),
                        q,
                        page: 1,
                        signal: abortController.signal,
                    })

                    if (seq !== requestSeq) {
                        return
                    }

                    const selectedValues = Array.from(selectedByValue.value.keys())
                    optionsRef.value = mergeSelectedOptions(
                        response.data,
                        selectedValues,
                        selectedByValue.value,
                    )
                } catch (error) {
                    if (error instanceof DOMException && error.name === 'AbortError') {
                        return
                    }

                    throw error
                } finally {
                    if (seq === requestSeq) {
                        loading.value = false
                    }
                }
            })()
        }, debounceMs)
    }

    const resolveSelected = async (values: LookupPrimitive[]): Promise<void> => {
        if (values.length === 0) {
            selectedByValue.value = new Map()
            optionsRef.value = []

            return
        }

        abortController?.abort()
        abortController = new AbortController()
        const seq = ++requestSeq

        loading.value = true

        try {
            const response = await fetcher({
                ...buildBaseParams(),
                selected: values,
                page: 1,
                signal: abortController.signal,
            })

            if (seq !== requestSeq) {
                return
            }

            const next = new Map(selectedByValue.value)

            for (const row of response.data) {
                next.set(row.value, row)
            }

            selectedByValue.value = next

            const selectedValues = Array.from(next.keys())
            optionsRef.value = mergeSelectedOptions(response.data, selectedValues, next)
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return
            }

            throw error
        } finally {
            if (seq === requestSeq) {
                loading.value = false
            }
        }
    }

    const reset = (): void => {
        abortController?.abort()
        requestSeq++
        optionsRef.value = []
        searchTerm.value = ''
        selectedByValue.value = new Map()
        loading.value = false

        if (debounceTimer !== undefined) {
            clearTimeout(debounceTimer)
            debounceTimer = undefined
        }
    }

    return reactive({
        options: optionsRef,
        loading,
        searchTerm,
        selectedByValue: shallowReadonly(selectedByValue),
        hydrateSelected,
        fetchOptions,
        resolveSelected,
        reset,
    })
}
