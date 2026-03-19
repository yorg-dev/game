import type { Feature } from '@/models/Feature'

let features: Feature[] = []

export function setFeatures(list: Feature[]): void {
  features = list
}

/**
 * Returns true only when the feature exists AND is enabled.
 * Defaults to false if the key is absent.
 */
export function isFeatureEnabled(key: string): boolean {
  const feature = features.find((f) => f.key === key)
  return feature?.enabled ?? false
}
