export interface ResourceItem {
  name?: string;
  resource_group_name?: string;
  props?: Record<string, string>;
}

// Generic so callers get their own row type back, not just these three fields.
export function filterResourceList<T extends ResourceItem>(
  list: T[] | undefined,
  resourceGroup: string | undefined,
  searchKey: string | undefined,
): T[] {
  if (!list) return [];

  let filtered = [...list];

  if (resourceGroup) {
    filtered = filtered.filter((item) => item.resource_group_name === resourceGroup);
  }

  if (searchKey && searchKey.trim().length >= 2) {
    const lowerKey = searchKey.trim().toLowerCase();
    filtered = filtered.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(lowerKey);

      const auxMatch = Object.entries(item.props || {})
        .filter(([key]) => key.startsWith('Aux/'))
        .some(([_, value]) => value?.toLowerCase().includes(lowerKey));

      return nameMatch || auxMatch;
    });
  }

  return filtered;
}
