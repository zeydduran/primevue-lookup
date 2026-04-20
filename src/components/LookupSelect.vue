<script setup lang="ts">
import AutoComplete from 'primevue/autocomplete'
import { computed, unref, useAttrs, watch } from 'vue'

defineOptions({
    inheritAttrs: false,
})
import { useLookup } from '../composables/useLookup'
import type { LookupFetcher, LookupOption, LookupPrimitive } from '../types/lookup'
import { normalizeModelValue } from '../utils/normalizeModelValue'

const props = withDefaults(
    defineProps<{
        endpoint: string
        multiple?: boolean
        placeholder?: string
        disabled?: boolean
        debounceMs?: number
        perPage?: number
        filters?: Record<string, unknown>
        exclude?: LookupPrimitive[]
        fetcher?: LookupFetcher
        /** `filters` değişince önbelleği temizleyip seçili etiketleri yeniden çözer */
        resetOnFiltersChange?: boolean
        invalid?: boolean
    }>(),
    {
        multiple: false,
        resetOnFiltersChange: true,
        invalid: false,
    },
)

const attrs = useAttrs()

const modelValue = defineModel<LookupPrimitive | LookupPrimitive[] | null>({ default: null })
const emit = defineEmits<{
    (e: 'selection-meta', payload: LookupOption[]): void
}>()

const lookup = useLookup({
    endpoint: props.endpoint,
    multiple: props.multiple,
    perPage: props.perPage,
    debounceMs: props.debounceMs,
    filters: () => props.filters,
    exclude: () => props.exclude,
    fetcher: props.fetcher,
})

function isLookupOption(value: unknown): value is LookupOption {
    return typeof value === 'object' && value !== null && 'value' in value && 'label' in value
}

const autoCompleteModel = computed<LookupOption | LookupOption[] | null>({
    get() {
        const ids = normalizeModelValue(modelValue.value, props.multiple)
        const map = unref(lookup.selectedByValue)

        if (props.multiple) {
            return ids.map((id) => map.get(id) ?? { value: id, label: String(id) })
        }

        if (ids.length === 0) {
            return null
        }

        const id = ids[0]

        return map.get(id) ?? { value: id, label: String(id) }
    },
    set(value) {
        if (props.multiple) {
            const raw = Array.isArray(value) ? value : []
            const options = raw.filter(isLookupOption)
            lookup.hydrateSelected(options)
            modelValue.value = options.map((option) => option.value)
            emit('selection-meta', options)

            return
        }

        if (value === null || !isLookupOption(value)) {
            modelValue.value = null
            emit('selection-meta', [])

            return
        }

        lookup.hydrateSelected([value])
        modelValue.value = value.value
        emit('selection-meta', [value])
    },
})

let lastResolvedKey = ''

watch(
    () => JSON.stringify(normalizeModelValue(modelValue.value, props.multiple)),
    (key) => {
        if (key === lastResolvedKey) {
            return
        }

        lastResolvedKey = key
        void lookup.resolveSelected(normalizeModelValue(modelValue.value, props.multiple))
    },
    { immediate: true },
)

watch(
    () => JSON.stringify(props.filters ?? {}),
    () => {
        if (!props.resetOnFiltersChange) {
            return
        }

        lastResolvedKey = ''
        lookup.reset()
        void lookup.resolveSelected(normalizeModelValue(modelValue.value, props.multiple))
    },
)

function onComplete(event: { query: string }): void {
    void lookup.fetchOptions(event.query)
}
</script>

<template>
    <AutoComplete
        v-bind="attrs"
        v-model="autoCompleteModel"
        :suggestions="lookup.options"
        option-label="label"
        data-key="value"
        :multiple="multiple"
        :disabled="disabled"
        :placeholder="placeholder"
        :loading="lookup.loading"
        :delay="0"
        :min-length="0"
        :force-selection="true"
        :show-clear="true"
        :invalid="invalid"
        dropdown
        @complete="onComplete"
    />
</template>
