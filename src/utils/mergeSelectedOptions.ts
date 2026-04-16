import type { LookupOption, LookupPrimitive } from '../types/lookup'

export function mergeSelectedOptions(
    incoming: LookupOption[],
    selectedValues: LookupPrimitive[],
    selectedByValue: Map<LookupPrimitive, LookupOption>,
): LookupOption[] {
    const merged = new Map<LookupPrimitive, LookupOption>()

    for (const value of selectedValues) {
        const existing = selectedByValue.get(value)
        if (existing !== undefined) {
            merged.set(value, existing)
        }
    }

    for (const option of incoming) {
        merged.set(option.value, option)
    }

    return Array.from(merged.values())
}
