import axios from 'axios';

import request from '../utils/request';

export async function queryHosts(params) {
  const { datastoreConfig } = params;

  const endpoint = datastoreConfig.elasticsearch + '/' + datastoreConfig.run_index + '/_search';

  return request(endpoint, {
    method: 'POST',
    body: {
      aggs: {
        hosts: {
          terms: {
            field: 'run.host',
          },
        },
      },
    },
  });
}

export async function queryRuns(params) {
  const { datastoreConfig, selectedHost } = params;

  const endpoint = datastoreConfig.elasticsearch + '/' + datastoreConfig.run_index + '/_search';

  return request(endpoint, {
    method: 'POST',
    body: {
      query: {
        term: {
          'run.host': selectedHost,
        },
      },
      aggs: {
        runs: {
          terms: {
            field: 'run.id',
          },
          aggs: {
            'run.bench': {
              terms: {
                field: 'run.bench.name',
              },
            },
            'run.email': {
              terms: {
                field: 'run.user.email',
              },
            },
            'run.harness': {
              terms: {
                field: 'run.harness_name',
              },
            },
          },
        },
      },
    },
  });
}

export async function queryIterations(params) {
  const { datastoreConfig, selectedRuns } = params;

  const endpoint =
    datastoreConfig.elasticsearch +
    '/' +
    datastoreConfig.iteration_index +
    '/_search?filter_path=hits.hits._source';

  const iterationRequests = [];
  selectedRuns.forEach(run => {
    iterationRequests.push(
      request(endpoint, {
        method: 'POST',
        body: {
          query: {
            bool: {
              filter: [
                {
                  term: {
                    'run.id': run['run.id'],
                  },
                },
              ],
            },
          },
        },
      })
    );
  });

  return Promise.all(iterationRequests).then(response => {
    return response;
  });
}

export async function queryIterationTableSchema(params) {
  const { datastoreConfig, selectedRunId } = params;

  const endpoint =
    datastoreConfig.elasticsearch +
    '/' +
    datastoreConfig.metric_index +
    '/_search?filter_path=aggregations.source.buckets';

  return request(endpoint, {
    method: 'POST',
    body: {
      query: {
        term: {
          'run.id': selectedRunId,
        },
      },
      aggs: {
        source: {
          terms: {
            field: 'metric.source',
          },
          aggs: {
            type: {
              terms: {
                field: 'metric.type',
              },
              aggs: {
                device: {
                  terms: {
                    field: 'metric.device',
                  },
                  aggs: {
                    host: {
                      terms: {
                        field: 'metric.host',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function queryResult(params) {
  const { datastoreConfig, result } = params;

  const endpoint =
    datastoreConfig.elasticsearch + '/' + datastoreConfig.run_index + '/_search?source=';

  return request(endpoint, {
    method: 'POST',
    body: {
      query: {
        match: {
          'run.name': result,
        },
      },
      sort: '_index',
    },
  });
}
