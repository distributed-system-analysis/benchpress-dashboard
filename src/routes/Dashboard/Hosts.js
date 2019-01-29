import { Component } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Card, Table, Input, Button, Icon, Form, notification } from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
const FormItem = Form.Item;

@connect(({ global, dashboard, loading }) => ({
  hosts: dashboard.hosts,
  datastoreConfig: global.datastoreConfig,
  loadingHosts: loading.effects['dashboard/fetchHosts'],
  loadingConfig: loading.effects['global/fetchDatastoreConfig'],
}))
export default class Hosts extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hostSearch: [],
      selectedIndicesUpdated: false,
      searchText: '',
      filtered: false,
    };
  }

  componentDidMount() {
    this.queryDatastoreConfig();
  }

  queryDatastoreConfig = () => {
    const { dispatch } = this.props;

    dispatch({
      type: 'global/fetchDatastoreConfig',
    }).then(() => {
      this.fetchHosts();
    });
  };

  fetchHosts = () => {
    const { dispatch, datastoreConfig } = this.props;

    dispatch({
      type: 'dashboard/fetchHosts',
      payload: { datastoreConfig: datastoreConfig },
    });
  };

  openErrorNotification = month => {
    notification.error({
      message: 'Index Unavailable',
      description: month + ' does not contain any documents. Please select a different month.',
    });
  };

  onInputChange = e => {
    this.setState({ searchText: e.target.value });
  };

  onSearch = () => {
    const { hosts } = this.props;
    const { searchText } = this.state;
    const reg = new RegExp(searchText, 'gi');
    var hostSearch = hosts.slice();
    this.setState({
      filtered: !!searchText,
      hostSearch: hostSearch
        .map((record, i) => {
          const match = record.host.match(reg);
          if (!match) {
            return null;
          }
          return {
            ...record,
            host: (
              <span key={i}>
                {record.host.split(reg).map(
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

  retrieveResults = params => {
    const { dispatch } = this.props;

    dispatch({
      type: 'dashboard/updateSelectedHost',
      payload: params.key,
    }).then(() => {
      dispatch(
        routerRedux.push({
          pathname: '/dashboard/runs',
        })
      );
    });
  };

  emitEmpty = () => {
    this.searchInput.focus();
    this.setState({ hostSearch: '' });
    this.setState({ searchText: '' });
  };

  render() {
    const { hostSearch, searchText } = this.state;
    const { hosts, loadingHosts, loadingConfig } = this.props;
    const suffix = searchText ? <Icon type="close-circle" onClick={this.emitEmpty} /> : null;
    const columns = [
      {
        title: 'Host',
        dataIndex: 'host',
        key: 'host',
        sorter: (a, b) => compareByAlph(a.host, b.host),
      },
      {
        title: 'Runs',
        dataIndex: 'runs',
        key: 'runs',
        sorter: (a, b) => a.runs - b.runs,
      },
    ];

    return (
      <PageHeaderLayout title="Hosts">
        <Card bordered={false}>
          <Form layout={'inline'} style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
            <FormItem>
              <Input
                style={{ width: 300 }}
                ref={ele => (this.searchInput = ele)}
                prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                suffix={suffix}
                placeholder="Search hosts"
                value={this.state.searchText}
                onChange={this.onInputChange}
                onPressEnter={this.onSearch}
              />
            </FormItem>
            <FormItem>
              <Button type="primary" onClick={() => this.onSearch}>
                {'Search'}
              </Button>
            </FormItem>
          </Form>
          <Table
            style={{ marginTop: 20 }}
            columns={columns}
            dataSource={hostSearch.length > 0 ? hostSearch : hosts}
            defaultPageSize={20}
            onRowClick={this.retrieveResults.bind(this)}
            loading={loadingHosts || loadingConfig}
            showSizeChanger={true}
            showTotal={true}
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
