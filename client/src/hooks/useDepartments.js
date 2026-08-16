import { useStoreConfig } from "./useStoreConfig";

// Thin wrapper so pages that only need departments don't have to know
// they're riding on the store config endpoint.
export function useDepartments() {
  const { config, loaded } = useStoreConfig();
  return { departments: config.departments || [], loaded };
}
