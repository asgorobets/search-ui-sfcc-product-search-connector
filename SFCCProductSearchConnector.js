import { adaptResponse } from "./responseAdapter";
import { adaptRequest } from "./requestAdapter";
import querystring from "querystring";

class SFCCProductSearchConnector {
  /**
   * @callback next
   * @param {Object} updatedQueryOptions The options to send to the API
   */

  /**
   * @callback hook
   * @param {Object} queryOptions The options that are about to be sent to the API
   * @param {next} next The options that are about to be sent to the API
   */

  /**
   * @typedef Options
   * @param {string} endpoint Salesforce Commerce Cloud endpoint or proxy endpoint URL
   * @param {string} clientId Salesforce Commerce Cloud client id
   * @param {hook} beforeSearchCall=(queryOptions,next)=>next(queryOptions) A hook to amend query options before the request is sent to the
   *   API in a query on an "onSearch" event.
   * @param {hook} beforeAutocompleteResultsCall=(queryOptions,next)=>next(queryOptions) A hook to amend query options before the request is sent to the
   *   API in a "results" query on an "onAutocomplete" event.
   * @param {hook} beforeAutocompleteSuggestionsCall=(queryOptions,next)=>next(queryOptions) A hook to amend query options before the request is sent to
   * the API in a "suggestions" query on an "onAutocomplete" event.
   */

  /**
   * @param {Options} options
   */
  constructor({
    endpoint,
    clientId,
    beforeSearchCall = (queryOptions, next) => next(queryOptions),
    beforeAutocompleteResultsCall = (queryOptions, next) => next(queryOptions),
    beforeAutocompleteSuggestionsCall = (queryOptions, next) =>
      next(queryOptions)
  }) {
    if (!endpoint || !clientId) {
      throw Error("endpoint and clientId are required");
    }

    this.clientId = clientId;
    this.endpoint = endpoint;
    this.beforeSearchCall = beforeSearchCall;
    this.beforeAutocompleteResultsCall = beforeAutocompleteResultsCall;
    this.beforeAutocompleteSuggestionsCall = beforeAutocompleteSuggestionsCall;
  }

  search(query) {
    const params = {
      ...query,
      client_id: this.clientId
    };

    return fetch(`${this.endpoint}?${querystring.stringify(params)}`, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    })
      .then(response => response.json())
      .then(response => {
        return response;
      })
      .catch(error => console.error(error));
  }

  async onSearch(state, queryConfig) {
    const options = adaptRequest(state, queryConfig);
    const { resultsPerPage } = state;
    return this.beforeSearchCall(options, async newOptions => {
      const response = await this.search(newOptions);
      return adaptResponse(response, resultsPerPage);
    });
  }

  async onAutocomplete({ searchTerm }, queryConfig) {
    if (queryConfig.results) {
      const {
        current,
        filters,
        resultsPerPage,
        sortDirection,
        sortField
      } = queryConfig.results;
      const options = adaptRequest(
        {
          current,
          searchTerm,
          filters,
          resultsPerPage,
          sortDirection,
          sortField
        },
        queryConfig.results
      );

      return this.beforeAutocompleteResultsCall(options, async newOptions => {
        const response = await this.search(newOptions);
        return {
          autocompletedResults: adaptResponse(response).results
        };
      });
    }
    if (queryConfig.suggestions) {
      console.warn(
        "search-ui-sfcc-product-search-connector: Query suggestions on autocomplete not yet implemented."
      );
    }
  }

  onResultClick() {
    // Not implemented, override via handlers if needed.
  }

  onAutocompleteResultClick() {
    // Not implemented, override via handlers if needed.
  }
}

export default SFCCProductSearchConnector;
