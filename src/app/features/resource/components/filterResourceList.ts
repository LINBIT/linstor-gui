interface ResourceItem {
  name?: string;
  resource_group_name?: string;
  props?: Record<string, string>;
  [key: string]: any;
}

export function filterResourceList(
  list: ResourceItem[] | undefined,
  resourceGroup: string | undefined,
  searchKey: string | undefined,
): ResourceItem[] {
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
