import {
  queryHosts,
  queryRuns,
  queryResult,
  queryIterations,
  queryIterationTableSchema,
} from '../services/dashboard';
import _ from 'lodash';

export default {
  namespace: 'dashboard',

  state: {
    run: [],
    runs: [],
    configCategories: [],
    configData: [],
    iterations: [],
    hosts: [],
    selectedRuns: [],
    selectedHost: '',
    loading: false,
  },

  effects: {
    *fetchHosts({ payload }, { call, put }) {
      let response = yield call(queryHosts, payload);

      let hosts = [];
      response.aggregations.hosts.buckets.map(host => {
        hosts.push({
          key: host.key,
          host: host.key,
          runs: host.doc_count,
        });
      });

      yield put({
        type: 'getHosts',
        payload: hosts,
      });
    },
    *fetchRuns({ payload }, { call, put }) {
      let response = yield call(queryRuns, payload);

      let runs = [];
      response.aggregations.runs.buckets.map(run => {
        runs.push({
          key: run.key,
          ['run.docs']: run.doc_count,
          ['run.id']: run.key,
          ['run.harness']: run['run.harness'].buckets[0].key,
          ['run.user']: run['run.email'].buckets[0].key,
          ['run.bench']: run['run.bench'].buckets[0].key,
        });
      });

      yield put({
        type: 'getRuns',
        payload: runs,
      });
    },
    *fetchIterations({ payload }, { call, put }) {
      let response = yield call(queryIterations, payload);
      const { selectedRuns } = payload;

      let iterations = {};
      response.forEach((run, index) => {
        iterations[selectedRuns[index]['run.id']] = run.hits.hits;
      });

      yield put({
        type: 'getIterations',
        payload: iterations,
      });
    },
    *fetchIterationTableSchema({ payload }, { call, put }) {
      let response = yield call(queryIterationTableSchema, payload);

      yield put({
        type: 'getIterationTableSchema',
        payload: response,
      });
    },
    *fetchResult({ payload }, { call, put }) {
      let response = yield call(queryResult, payload);

      let result = typeof response.hits.hits[0] !== 'undefined' ? response.hits.hits[0] : [];

      yield put({
        type: 'getResult',
        payload: result,
      });
    },
    *updateSelectedHost({ payload }, { select, put }) {
      yield put({
        type: 'modifySelectedHost',
        payload: payload,
      });
    },
    *updateSelectedRuns({ payload }, { select, put }) {
      yield put({
        type: 'modifySelectedRuns',
        payload: payload,
      });
    },
    *updateConfigCategories({ payload }, { select, put }) {
      yield put({
        type: 'modifyConfigCategories',
        payload: payload,
      });
    },
    *updateConfigData({ payload }, { select, put }) {
      yield put({
        type: 'modifyConfigData',
        payload: payload,
      });
    },
  },

  reducers: {
    getHosts(state, { payload }) {
      return {
        ...state,
        hosts: payload,
      };
    },
    getRuns(state, { payload }) {
      return {
        ...state,
        runs: payload,
      };
    },
    getResult(state, { payload }) {
      return {
        ...state,
        run: payload,
      };
    },
    getIterations(state, { payload }) {
      return {
        ...state,
        iterations: payload,
      };
    },
    getIterationTableSchema(state, { payload }) {
      return {
        ...state,
        iterationTableSchema: payload,
      };
    },
    modifySelectedHost(state, { payload }) {
      return {
        ...state,
        selectedHost: payload,
      };
    },
    modifySelectedRuns(state, { payload }) {
      return {
        ...state,
        selectedRuns: payload,
      };
    },
    modifyConfigCategories(state, { payload }) {
      return {
        ...state,
        configCategories: payload,
      };
    },
    modifyConfigData(state, { payload }) {
      return {
        ...state,
        configData: payload,
      };
    },
  },
};
