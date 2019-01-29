import React, { Component } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Tag, Card, Table, Input, Button } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';

@connect(({ global, dashboard, loading }) => ({
  runs: dashboard.runs,
  selectedHost: dashboard.selectedHost,
  datastoreConfig: global.datastoreConfig,
  loadingRuns: loading.effects['dashboard/fetchRuns'],
}))
export default class Runs extends Component {
  constructor(props) {
    super(props);

    this.state = {
      runSearch: [],
      selectedRowKeys: [],
      loadingButton: false,
      searchText: '',
    };
  }

  componentDidMount() {
    const { dispatch, datastoreConfig, selectedHost } = this.props;

    dispatch({
      type: 'dashboard/fetchRuns',
      payload: {
        datastoreConfig,
        selectedHost,
      },
    });
  }

  openNotificationWithIcon = type => {
    notification[type]({
      message: 'Please select two runs for comparison.',
      placement: 'bottomRight',
    });
  };

  onCompareResults = () => {
    const { selectedRowKeys } = this.state;
    const { selectedHost, runs } = this.props;
    let selectedRuns = [];
    for (var item in selectedRowKeys) {
      var run = runs[selectedRowKeys[item]];
      run['controller'] = selectedHost;
      selectedRuns.push(runs[selectedRowKeys[item]]);
    }
    this.compareResults(selectedRuns);
  };

  onSelectChange = selectedRowKeys => {
    const { dispatch, runs } = this.props;
    const selectedRowNames = [];
    selectedRowKeys.map(row => {
      selectedRowNames.push(runs[row]);
    });
    this.setState({ selectedRowKeys });

    dispatch({
      type: 'dashboard/updateSelectedRuns',
      payload: selectedRowNames,
    });
  };

  onInputChange = e => {
    this.setState({ searchText: e.target.value });
  };

  onSearch = () => {
    const { searchText } = this.state;
    const { runs } = this.props;
    const reg = new RegExp(searchText, 'gi');
    let runSearch = runs.slice();
    this.setState({
      filtered: !!searchText,
      runSearch: runSearch
        .map((record, i) => {
          const match = record.run.match(reg);
          if (!match) {
            return null;
          }
          return {
            ...record,
            run: (
              <span key={i}>
                {record['run.name'].split(reg).map(
                  (text, i) =>
                    i > 0
                      ? [
                          <span key={i} style={{ color: 'orange' }}>
                            {match[0]}
                          </span>,
                          text,
                        ]
                      : text
                )}
              </span>
            ),
          };
        })
        .filter(record => !!record),
    });
  };

  compareResults = () => {
    const { dispatch } = this.props;

    dispatch(
      routerRedux.push({
        pathname: '/dashboard/comparison-select',
      })
    );
  };

  fetchRunSummary = params => {
    const { dispatch } = this.props;

    dispatch({
      type: 'dashboard/updateSelectedRuns',
      payload: [params],
    }).then(() => {
      dispatch(
        routerRedux.push({
          pathname: '/dashboard/summary',
        })
      );
    });
  };

  render() {
    const { runSearch, loadingButton, selectedRowKeys } = this.state;
    const { selectedHost, runs, loadingRuns } = this.props;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
      hideDefaultSelections: true,
      fixed: true,
    };
    const hasSelected = selectedRowKeys.length > 0;
    for (var run in runs) {
      runs[run]['key'] = run;
    }

    const columns = [
      {
        title: 'Run ID',
        dataIndex: 'run.id',
        key: 'run.id',
      },
      {
        title: 'Harness',
        dataIndex: 'run.harness',
        key: 'run.harness',
      },
      {
        title: 'Benchmark',
        dataIndex: 'run.bench',
        key: 'run.bench',
      },
      {
        title: 'User',
        dataIndex: 'run.user',
        key: 'run.user',
      },
      {
        title: '# of Docs',
        dataIndex: 'run.docs',
        key: 'run.docs',
      },
    ];

    return (
      <PageHeaderLayout title={selectedHost}>
        <Card bordered={false}>
          <Input
            style={{ width: 300, marginRight: 8, marginTop: 16 }}
            ref={ele => {
              return (this.searchInput = ele);
            }}
            placeholder="Search Results"
            value={this.state.searchText}
            onChange={this.onInputChange}
            onPressEnter={this.onSearch}
          />
          <Button type="primary" onClick={this.onSearch}>
            {'Search'}
          </Button>
          {selectedRowKeys.length > 0 ? (
            <Card
              style={{ marginTop: 16 }}
              hoverable={false}
              title={
                <Button
                  type="primary"
                  onClick={this.onCompareResults}
                  disabled={!hasSelected}
                  loading={loadingButton}
                >
                  {'Compare Results'}
                </Button>
              }
              hoverable={false}
              type="inner"
            >
              {selectedRowKeys.map((row, i) => (
                <Tag key={i} id={row}>
                  {runs[row]['run.name']}
                </Tag>
              ))}
            </Card>
          ) : (
            <div />
          )}
          <Table
            style={{ marginTop: 20 }}
            rowSelection={rowSelection}
            columns={columns}
            dataSource={runSearch.length > 0 ? runsearch : runs}
            onRowClick={this.fetchRunSummary.bind(this)}
            loading={loadingRuns}
            pagination={{ pageSize: 20 }}
            bordered
          />
        </Card>
      </PageHeaderLayout>
    );
  }
}

function compareByAlph(a, b) {
  if (a > b) {
    return -1;
  }
  if (a < b) {
    return 1;
  }
  return 0;
}
