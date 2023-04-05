/*
 * Copyright 2017-2023 EPAM Systems, Inc. (https://www.epam.com/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import classNames from 'classnames';
import {inject, observer} from 'mobx-react';
import {computed} from 'mobx';
import {
  Button,
  Select,
  Dropdown,
  Icon,
  Pagination,
  Menu,
  Input,
  Spin,
  Alert, message, Modal
} from 'antd';
import displayDate from '../../../../utils/displayDate';
import highlightText from '../../highlightText';
import Label from '../special/label';
import GitlabIssuesLoad from '../../../../models/gitlab-issues/GitlabIssuesLoad';
import getAuthor from '../special/utilities/get-author';
import UserName from '../../UserName';
import NewTicketForm from '../special/new-ticket-form';
import GitlabIssueCreate from '../../../../models/gitlab-issues/GitlabIssueCreate';
import GitlabIssueDelete from '../../../../models/gitlab-issues/GitlabIssueDelete';
import styles from './ticket-list.css';
import mainStyles from '../tickets.css';

const PAGE_SIZE = 20;
const ENABLE_CONTROLS = false;

@inject('preferences')
@observer
class TicketsList extends React.Component {
  state = {
    filters: {
      search: '',
      labels: []
    },
    page: 1,
    error: undefined,
    tickets: [],
    total: 0,
    pending: false,
    newTicketModalVisible: false,
    newTicketPending: false
  }

  filtersRefreshTimeout;

  componentDidMount () {
    this.reload();
  }

  componentWillUnmount () {
    if (this.filtersRefreshTimeout) {
      clearTimeout(this.filtersRefreshTimeout);
    }
  }

  @computed
  get predefinedLabels () {
    const {preferences} = this.props;
    if (preferences && preferences.loaded) {
      return (preferences.gitlabIssueStatuses || []);
    }
    return [];
  }

  get filtersTouched () {
    const {filters} = this.state;
    return filters.search || filters.labels.length > 0;
  }

  onFiltersChange = (field, eventType) => event => {
    let value;
    switch (eventType) {
      case 'checkbox':
        value = event.target.checked;
        break;
      case 'input':
        value = event.target.value;
        break;
      case 'select':
        value = event;
        break;
      default:
        value = undefined;
    }
    if (value === undefined) {
      return;
    }
    this.setState({
      filters: {
        ...this.state.filters,
        [field]: value
      }
    }, () => {
      clearTimeout(this.filtersRefreshTimeout);
      this.filtersRefreshTimeout = undefined;
      this.filtersRefreshTimeout = setTimeout(() => {
        this.setState({
          page: 1
        }, () => this.fetchCurrentPage());
      }, 600);
    });
  };

  clearFilters = () => {
    clearTimeout(this.filtersRefreshTimeout);
    this.filtersRefreshTimeout = undefined;
    this.setState({
      filters: {
        search: '',
        labels: []
      }
    }, () => this.reload());
  };

  fetchCurrentPageToken = 0;

  fetchCurrentPage = () => {
    const {
      page,
      filters
    } = this.state;
    this.fetchCurrentPageToken += 1;
    const token = this.fetchCurrentPageToken;
    this.setState({
      pending: true
    }, async () => {
      const state = {
        pending: false
      };
      const commit = () => {
        if (token === this.fetchCurrentPageToken) {
          this.setState(state);
        }
      };
      const request = new GitlabIssuesLoad(page, PAGE_SIZE);
      try {
        await request.send(filters);
        if (request.error) {
          throw new Error(request.error);
        }
        const {
          elements = [],
          totalCount = 0
        } = request.value || {};
        state.tickets = elements;
        state.total = totalCount;
        state.error = undefined;
      } catch (error) {
        state.error = error.message;
      } finally {
        commit();
      }
    });
  };

  onPageChange = (page) => {
    this.setState({page}, () => this.fetchCurrentPage());
  };

  onSelectMenu = (key, ticket) => {
    if (key === 'delete') {
      this.deleteTicketConfirmation(ticket);
    }
  };

  onSelectTicket = (ticket) => {
    const {
      router
    } = this.props;
    if (!ticket || !router) {
      return;
    }
    router.push(`/tickets/${ticket.iid}`);
  };

  renderTableHeader = () => {
    const {filters} = this.state;
    return (
      <div
        className={
          classNames(
            styles.ticketContainer,
            styles.header,
            'cp-divider',
            'bottom',
            'cp-card-background-color'
          )
        }
      >
        <b
          className={styles.status}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            fontSize: 'revert'
          }}
        >
          Status
        </b>
        <b
          className={styles.title}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            flexDirection: 'row'
          }}
        >
          Title
        </b>
        <div className={styles.controls}>
          {
            this.filtersTouched && (
              <a
                className={
                  classNames(
                    styles.tableControl
                  )
                }
                onClick={this.filtersTouched ? this.clearFilters : undefined}
                style={{whiteSpace: 'nowrap'}}
              >
                Clear filters
              </a>
            )
          }
          <Input.Search
            placeholder="Search"
            value={filters.search}
            onChange={this.onFiltersChange('search', 'input')}
            id="tickets-search-filter"
            className={styles.tableControl}
            style={{minWidth: '200px'}}
          />
          <Select
            onChange={this.onFiltersChange('labels', 'select')}
            value={filters.labels}
            style={{minWidth: '200px'}}
            className={styles.tableControl}
            placeholder="Select ticket status"
            mode="multiple"
            id="tickets-labels-filter"
          >
            {this.predefinedLabels.map(label => (
              <Select.Option key={label}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
    );
  };

  renderTicket = (ticket) => {
    const {
      filters,
      pending
    } = this.state;
    const menu = (
      <Menu
        onClick={({key}) => this.onSelectMenu(key, ticket)}
        selectedKeys={[]}
        style={{cursor: 'pointer'}}
      >
        <Menu.Item key="close">
          Close ticket
        </Menu.Item>
        <Menu.Item key="delete">
          Delete
        </Menu.Item>
      </Menu>
    );
    const getLabel = (labels) => (labels || [])
      .find(label => this.predefinedLabels.includes(label));
    return (
      <div
        key={ticket.iid}
        className={
          classNames(
            styles.ticketContainer,
            'cp-divider',
            'bottom',
            'cp-table-element',
            {'cp-table-element-disabled': pending}
          )
        }
        onClick={() => this.onSelectTicket(ticket)}
      >
        <Label
          className={styles.status}
          label={getLabel(ticket.labels)}
        />
        <div
          className={styles.title}
        >
          <b>
            {highlightText(ticket.title, filters.search)}
          </b>
          <span
            className="cp-text-not-important"
            style={{fontSize: 'smaller'}}
          >
            {'Opened '}
            {displayDate(ticket.created_at, 'D MMM YYYY, HH:mm')}
            {' by '}
            <UserName
              showIcon
              userName={getAuthor(ticket)}
            />
          </span>
        </div>
        <div className={styles.controls}>
          {
            ENABLE_CONTROLS && (
              <Dropdown
                overlay={menu}
                trigger={['click']}
                onClick={e => e.stopPropagation()}
                disabled={pending}
              >
                <Icon
                  type="ellipsis"
                  style={{
                    cursor: 'pointer',
                    marginRight: 10,
                    fontSize: 'large',
                    fontWeight: 'bold'
                  }}
                />
              </Dropdown>
            )
          }
        </div>
      </div>
    );
  }

  reload = () => {
    this.setState({
      page: 1
    }, () => this.fetchCurrentPage());
  };

  openNewTicketModal = () => {
    this.setState({
      newTicketModalVisible: true
    });
  };

  closeNewTicketModal = () => {
    this.setState({
      newTicketModalVisible: false
    });
  };

  createNewTicket = (payload) => {
    this.setState({
      newTicketPending: true
    }, async () => {
      const hide = message.loading('Creating ticket...', 0);
      const request = new GitlabIssueCreate();
      try {
        await request.send(payload);
        if (request.error) {
          throw new Error(request.error);
        }
      } catch (error) {
        message.error(request.error, 5);
      } finally {
        hide();
        if (request.error) {
          this.setState({
            newTicketPending: false
          });
        } else {
          this.setState({
            newTicketPending: false,
            newTicketModalVisible: false
          }, () => this.reload());
        }
      }
    });
  };

  deleteTicketConfirmation = (ticket) => {
    if (!ticket) {
      return;
    }
    const {
      title,
      iid: id
    } = ticket;
    Modal.confirm({
      title: (
        <div>
          Are you sure you want to remove ticket <b>{title}</b> (#{id})?
        </div>
      ),
      style: {
        wordWrap: 'break-word'
      },
      onOk: () => this.deleteTicket(ticket),
      okText: 'REMOVE',
      cancelText: 'CANCEL'
    });
  };

  deleteTicket = async (ticket) => {
    if (!ticket) {
      return;
    }
    const {
      iid: id
    } = ticket;
    const hide = message.loading(`Deleting ticket ${id}...`, 0);
    const request = new GitlabIssueDelete(id);
    await request.fetch();
    hide();
    if (request.error) {
      message.error(request.error, 5);
    } else {
      this.reload();
    }
  };

  render () {
    const {
      page,
      newTicketModalVisible,
      tickets,
      total = 0,
      pending,
      error,
      newTicketPending
    } = this.state;
    return (
      <div
        className={
          classNames(
            mainStyles.container,
            'cp-panel',
            'cp-panel-no-hover',
            'cp-panel-borderless'
          )
        }
      >
        <div
          className={mainStyles.headerContainer}
        >
          <b className={mainStyles.heading}>
            Tickets
          </b>
          <Button
            onClick={this.reload}
            style={{marginLeft: 5}}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            onClick={this.openNewTicketModal}
            style={{marginLeft: 5}}
          >
            Create new ticket
          </Button>
        </div>
        {
          error && (
            (
              <Alert
                message="Error retrieving tickets"
                type="error"
              />
            )
          )
        }
        {
          !error && (
            <div
              className={styles.ticketsTable}
            >
              {this.renderTableHeader()}
              <Spin
                spinning={pending}
                wrapperClassName={styles.tableSpin}
              >
                {tickets.map(this.renderTicket)}
              </Spin>
            </div>
          )
        }
        {
          !error && (
            <div className={styles.paginationRow}>
              <Pagination
                total={total}
                size="small"
                disabled={pending}
                current={page}
                onChange={this.onPageChange}
                pageSize={PAGE_SIZE}
              />
            </div>
          )
        }
        <NewTicketForm
          title="Create new ticket"
          onSave={this.createNewTicket}
          onCancel={this.closeNewTicketModal}
          pending={newTicketPending}
          renderAsModal
          modalVisible={newTicketModalVisible}
        />
      </div>
    );
  }
}

export default TicketsList;
