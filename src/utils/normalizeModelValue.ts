import type { LookupPrimitive } from '../types/lookup'

export function normalizeModelValue(
    modelValue: LookupPrimitive | LookupPrimitive[] | null | undefined,
    multiple: boolean,
): LookupPrimitive[] {
    if (modelValue === null || modelValue === undefined) {
        return []
    }

    if (multiple) {
        return Array.isArray(modelValue) ? modelValue : []
    }

    return Array.isArray(modelValue) ? modelValue : [modelValue]
}
