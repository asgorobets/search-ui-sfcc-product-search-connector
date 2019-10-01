const addEachKeyValueToObject = (acc, [key, value]) => ({
  ...acc,
  [key]: value
});

const getFacetValue = facet => {
  return facet.values.map(facet_value => ({
    value: facet_value.value,
    // Support to use "name" field as label and "value" as
    // value will need to exist in the "view".
    name: facet_value.label,
    count: facet_value.hit_count,
    // Support for hierarchical facets (cgid).
    ...(facet_value.values && { children: getFacetValue(facet_value) })
  }));
};

const getFacets = data => {
  return data
    .filter(facet => !!facet.values)
    .map(facet => {
      return [
        facet.attribute_id,
        [
          {
            field: facet.attribute_id,
            data: getFacetValue(facet),
            // TODO: Add support for other types.
            type: "value"
          }
        ]
      ];
    })
    .reduce(addEachKeyValueToObject, {});
};

const getResults = records => {
  const toObjectWithRaw = value => ({ raw: value });

  return records.map(record => {
    const { product_id, ...rest } = record;
    const result = Object.entries(rest)
      .map(([fieldName, fieldValue]) => [
        fieldName,
        toObjectWithRaw(fieldValue)
      ])
      .reduce(addEachKeyValueToObject, {});

    result.id = toObjectWithRaw(product_id);

    return result;
  });
};

export function adaptResponse(response, resultsPerPage) {
  const results = response.hits ? getResults(response.hits) : [];
  const totalPages = Math.ceil(response.total / resultsPerPage);
  const totalResults = response.total;
  const requestId = "";
  const facets = response.refinements ? getFacets(response.refinements) : [];

  return {
    results,
    totalPages,
    totalResults,
    requestId,
    ...(Object.keys(facets).length > 0 && { facets })
  };
}
