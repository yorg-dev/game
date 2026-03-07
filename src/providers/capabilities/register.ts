import * as fetchUtils from "../fetchUtils";

const capability = (apiUrl: string, httpClient = fetchUtils.fetchJson) => ({
  register: (resource: string, params: { data: unknown }) => {
    const { data } = params;

    const options = {
      method: 'POST',
      body: JSON.stringify(data),
    };

    const url = `${apiUrl}/${resource}`;

    return httpClient(url, options)
      .then(({ json }) => ({ data: json }));
  }
});

export default capability;
