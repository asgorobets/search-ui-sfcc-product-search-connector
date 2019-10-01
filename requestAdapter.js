export function adaptRequest(state, queryConfig) {
  const { searchTerm, resultsPerPage, current, filters, sortField } = state;

  return {
    q: searchTerm,
    count: resultsPerPage,
    start: (current - 1) * resultsPerPage,
    refine:
      filters &&
      filters
        .map(filter => `${filter.field}=${filter.values.join("|")}`)
        .join(","),
    ...(queryConfig.extraParams && queryConfig.extraParams),
    sort: sortField
  };
}
