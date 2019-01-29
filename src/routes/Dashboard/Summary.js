import React, { Component } from 'react';
import { connect } from 'dva';
import { Select, Spin, Tag, Table, Button, Card, notification } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';

const tabList = [
  {
    key: 'iterations',
    tab: 'Iterations',
  },
  {
    key: 'metrics',
    tab: 'Metrics',
  },
  {
    key: 'metadata',
    tab: 'Metadata',
  },
];

@connect(({ global, dashboard, loading }) => ({
  selectedHost: dashboard.selectedHost,
  selectedRuns: dashboard.selectedRuns,
  iterations: dashboard.iterations,
  runSummary: dashboard.run,
  runs: dashboard.runs,
  datastoreConfig: global.datastoreConfig,
  loadingSummary: loading.effects['dashboard/fetchIterations'],
}))
class Summary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      summaryResult: [],
      iterations: [],
      iterationSearch: [],
      tableColumns: [],
      configData: {},
      selectedConfig: [],
      responseData: {},
      selectedPort: 'all',
      ports: [],
      loading: true,
      searchText: '',
      activeTab: 'iterations',
    };
  }

  componentDidMount() {
    const { dispatch, datastoreConfig, selectedRuns } = this.props;

    dispatch({
      type: 'dashboard/fetchIterations',
      payload: {
        datastoreConfig,
        selectedRuns,
      },
    }).then(() => {
      this.generateSummaryColumns();
    });
  }

  onSearch = () => {
    const { searchText, iterations } = this.state;
    const reg = new RegExp(searchText, 'gi');
    const iterationSearch = iterations.slice();
    this.setState({
      filtered: !!searchText,
      iterationSearch: iterationSearch
        .map(record => {
          const match = record.iteration_name.match(reg);
          if (!match) {
            return null;
          }
          return {
            ...record,
            iteration_name: (
              <span>
                {record.iteration_name
                  .split(reg)
                  .map(
                    (text, i) =>
                      i > 0 ? [<span style={{ color: 'orange' }}>{match[0]}</span>, text] : text
                  )}
              </span>
            ),
          };
        })
        .filter(record => !!record),
    });
  };

  configChange = (value, category) => {
    const { selectedConfig } = this.state;
    if (value == undefined) {
      delete selectedConfig[category];
    } else {
      selectedConfig[category] = value;
    }
    this.setState({ selectedConfig });
  };

  clearFilters = () => {
    this.setState({ selectedConfig: [] });
    this.setState({ selectedPort: 'all' });
  };

  onTabChange = key => {
    this.setState({ activeTab: key });
  };

  generateSummaryColumns = () => {
    const { iterations } = this.props;
    let { tableColumns } = this.state;
    const selectedRunIds = Object.keys(iterations);
    const iteration = iterations[selectedRunIds.shift()].shift();

    let tableFields = ['iteration', 'metric', 'run'];

    tableFields.forEach(table => {
      let tableColumnData = [];

      Object.keys(iteration['_source'][table]).forEach(field => {
        if (typeof iteration['_source'][table][field] === 'object') {
          let nestedTableColumnData = [];

          Object.keys(iteration['_source'][table][field]).forEach(nestedField => {
            nestedTableColumnData.push({
              title: nestedField,
              dataIndex: '_source' + '.' + table + '.' + field + '.' + nestedField,
              key: table + '.' + field + '.' + nestedField,
            });
          });

          tableColumns[table + '.' + field] = nestedTableColumnData;
        } else {
          tableColumnData.push({
            title: field,
            dataIndex: '_source' + '.' + table + '.' + field,
            key: table + '.' + field,
          });
        }
      });

      tableColumns[table] = tableColumnData;
    });

    this.setState({ tableColumns });
  };

  render() {
    const { activeTab, tableColumns } = this.state;
    const { selectedRuns, iterations, loadingSummary, selectedHost } = this.props;
    const selectedRunIds = Object.keys(iterations);
    const iterationObjects =
      Object.keys(iterations).length > 0 ? iterations[selectedRunIds.shift()] : [];

    const iterationColumns = [
      {
        title: 'Iteration ID',
        dataIndex: '_source.iteration.id',
        key: 'iteration.id',
      },
      {
        title: 'Primary Metric',
        dataIndex: '_source.iteration.primary_metric',
        key: 'iteration.primary_metric',
      },
    ];

    const metadataOverviewColumns = [
      {
        title: 'Run ID',
        dataIndex: '_source.run.id',
        key: 'run.id',
      },
      {
        title: '',
      },
    ];

    const contentList = {
      iterations: (
        <Card title="Iterations" style={{ marginTop: 32 }}>
          <Table
            loading={loadingSummary}
            columns={tableColumns['iteration']}
            dataSource={iterationObjects}
            bordered
            pagination={{ pageSize: 20 }}
          />
        </Card>
      ),
      metrics: (
        <Card title="Metrics" style={{ marginTop: 32 }}>
          <Table
            loading={loadingSummary}
            columns={tableColumns['metric']}
            dataSource={iterationObjects}
            bordered
            pagination={{ pageSize: 20 }}
          />
        </Card>
      ),
      metadata: (
        <Card title="Result Metadata" style={{ marginTop: 32 }}>
          <Table
            loading={loadingSummary}
            columns={tableColumns['run.bench']}
            dataSource={iterationObjects}
            bordered
            pagination={{ pageSize: 20 }}
          />
          <Table
            loading={loadingSummary}
            columns={tableColumns['run.user']}
            dataSource={iterationObjects}
            bordered
            pagination={{ pageSize: 20 }}
          />
          <Table
            loading={loadingSummary}
            columns={tableColumns['run']}
            dataSource={iterationObjects}
            bordered
            pagination={{ pageSize: 20 }}
          />
        </Card>
      ),
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div>
          <PageHeaderLayout
            title={Object.keys(iterations)[0]}
            content={
              <Tag color="blue" key={selectedHost}>
                {`host: ${selectedHost}`}
              </Tag>
            }
            tabList={tabList}
            tabActiveKey={activeTab}
            onTabChange={this.onTabChange}
          />
          {contentList[activeTab]}
        </div>
      </div>
    );
  }
}

export default connect(() => ({}))(Summary);
