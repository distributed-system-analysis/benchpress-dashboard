import React, { Component } from 'react';
import { connect } from 'dva';
import { Tag, Table, Card } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';

const tabList = [
  {
    key: 'iterations',
    tab: 'Iterations',
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
    });
  }

  render() {
    const { activeTab } = this.state;
    const { iterations, loadingSummary, selectedHost, selectedRuns } = this.props;

    const iterationColumns = [
      {
        title: 'ID',
        dataIndex: 'id',
      },
      {
        title: 'Params',
        dataIndex: 'params',
      },
    ];

    const contentList = {
      iterations: (
        <Card style={{ marginTop: 32 }}>
          <Table
            rowKey={record => record.id}
            loading={loadingSummary}
            columns={iterationColumns}
            dataSource={iterations[selectedRuns[0]['run.id']]}
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
