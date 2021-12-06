/*
 * Copyright 2017-2020 EPAM Systems, Inc. (https://www.epam.com/)
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
import {inject, observer} from 'mobx-react';
import {
  Pagination,
  Table
} from 'antd';
import moment from 'moment-timezone';
import {
  BarChart,
  BillingTable,
  Summary
} from './charts';
import {
  costTickFormatter,
  numberFormatter,
  DisplayUser,
  ResizableContainer,
  getPeriodMonths
} from './utilities';
import Filters, {RUNNER_SEPARATOR, REGION_SEPARATOR} from './filters';
import {Period, getPeriod} from './periods';
import StorageFilter, {StorageFilters} from './filters/storage-filter';
import Export, {ExportComposers} from './export';
import Discounts, {discounts} from './discounts';
import {
  GetBillingData,
  GetGroupedStorages,
  GetGroupedStoragesWithPrevious,
  GetGroupedFileStorages,
  GetGroupedFileStoragesWithPrevious,
  GetGroupedObjectStorages,
  GetGroupedObjectStoragesWithPrevious
} from '../../../models/billing';
import {StorageReportLayout, Layout} from './layout';
import styles from './reports.css';
import displayDate from '../../../utils/displayDate';

const tablePageSize = 10;

function injection (stores, props) {
  const {location, params} = props;
  const {type} = params || {};
  const {
    user: userQ,
    group: groupQ,
    period = Period.month,
    range,
    region: regionQ
  } = location.query;
  const periodInfo = getPeriod(period, range);
  const group = groupQ ? groupQ.split(RUNNER_SEPARATOR) : undefined;
  const user = userQ ? userQ.split(RUNNER_SEPARATOR) : undefined;
  const cloudRegionId = regionQ && regionQ.length ? regionQ.split(REGION_SEPARATOR) : undefined;
  const filters = {
    group,
    user,
    type,
    cloudRegionId,
    ...periodInfo
  };
  const periods = getPeriodMonths(periodInfo);
  const exportCsvRequest = [];
  let filterBy = GetBillingData.FILTER_BY.storages;
  let storages;
  let storagesTable;
  let storageType;
  if (/^file$/i.test(type)) {
    storageType = 'FILE_STORAGE';
    storages = new GetGroupedFileStoragesWithPrevious(filters, true);
    storagesTable = new GetGroupedFileStorages(filters, true);
    filterBy = GetBillingData.FILTER_BY.fileStorages;
    if (periods && periods.length > 0) {
      exportCsvRequest.push(...periods.map(p => (
        new GetGroupedFileStorages(
          {...filters, ...p, name: Period.month},
          true
        )
      )));
    }
  } else if (/^object$/i.test(type)) {
    storageType = 'OBJECT_STORAGE';
    storages = new GetGroupedObjectStoragesWithPrevious(filters, true);
    storagesTable = new GetGroupedObjectStorages(filters, true);
    filterBy = GetBillingData.FILTER_BY.objectStorages;
    if (periods && periods.length > 0) {
      exportCsvRequest.push(...periods.map(p => (
        new GetGroupedObjectStorages(
          {...filters, ...p, name: Period.month},
          true
        )
      )));
    }
  } else {
    storages = new GetGroupedStoragesWithPrevious(filters, true);
    storagesTable = new GetGroupedStorages(filters, true);
    if (periods && periods.length > 0) {
      exportCsvRequest.push(...periods.map(p => (
        new GetGroupedStorages(
          {...filters, ...p, name: Period.month},
          true
        )
      )));
    }
  }
  exportCsvRequest.push(storages);
  storages.fetch();
  storagesTable.fetch();
  const summary = new GetBillingData({
    ...filters,
    filterBy
  });
  summary.fetch();

  return {
    user,
    group,
    type,
    summary,
    storages,
    exportCsvRequest,
    storagesTable,
    storageType
  };
}

function renderTable ({storages, discounts: discountsFn, height}) {
  if (!storages || !storages.loaded) {
    return null;
  }
  const columns = [
    {
      key: 'storage',
      title: 'Storage',
      render: ({info, name}) => {
        return info && info.name ? info.pathMask || info.name : name;
      }
    },
    {
      key: 'owner',
      title: 'Owner',
      dataIndex: 'owner',
      render: owner => (<DisplayUser userName={owner} />)
    },
    {
      key: 'billingCenter',
      title: 'Billing Center',
      dataIndex: 'billingCenter'
    },
    {
      key: 'storageType',
      title: 'Type',
      dataIndex: 'storageType'
    },
    {
      key: 'cost',
      title: 'Cost',
      dataIndex: 'value',
      render: (value) => value ? costTickFormatter(value) : null
    },
    {
      key: 'volume',
      title: 'Avg. Vol. (GB)',
      dataIndex: 'usage',
      render: (value) => value ? numberFormatter(value) : null
    },
    {
      key: 'volume current',
      title: 'Cur. Vol. (GB)',
      dataIndex: 'usageLast',
      render: (value) => value ? numberFormatter(value) : null
    },
    {
      key: 'region',
      title: 'Region',
      dataIndex: 'region'
    },
    {
      key: 'provider',
      title: 'Provider',
      dataIndex: 'provider'
    },
    {
      key: 'created',
      title: 'Created date',
      dataIndex: 'created',
      render: (value) => value ? moment.utc(value).format('DD MMM YYYY') : value
    }
  ];
  const dataSource = Object.values(
    discounts.applyGroupedDataDiscounts(storages.value || {}, discountsFn)
  );
  const paginationEnabled = storages && storages.loaded
    ? storages.totalPages > 1
    : false;
  return (
    <div>
      <div
        style={{
          position: 'relative',
          overflow: 'auto',
          maxHeight: height - (paginationEnabled ? 30 : 0),
          padding: 5
        }}
      >
        <Table
          rowKey={({info, name}) => {
            return info && info.id ? `storage_${info.id}` : `storage_${name}`;
          }}
          loading={storages.pending}
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          size="small"
        />
      </div>
      {
        paginationEnabled && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              height: 30
            }}
          >
            <Pagination
              current={storages.pageNum + 1}
              pageSize={storages.pageSize}
              total={storages.totalPages * storages.pageSize}
              onChange={async (page) => {
                await storages.fetchPage(page - 1);
              }}
              size="small"
            />
          </div>
        )
      }
    </div>
  );
}

const RenderTable = observer(renderTable);

class StorageReports extends React.Component {
  state = {
    dataSampleKey: StorageFilters.value.key
  };

  onChangeDataSample = (key) => {
    this.setState({
      dataSampleKey: key
    });
  };

  getSummaryTitle = () => {
    const {type} = this.props;
    if (/^file$/i.test(type)) {
      return 'File storages usage';
    }
    if (/^object$/i.test(type)) {
      return 'Object storages usage';
    }
    return 'Storages usage';
  };

  getTitle = () => {
    const {type} = this.props;
    if (/^file$/i.test(type)) {
      return 'File storages';
    }
    if (/^object$/i.test(type)) {
      return 'Object storages';
    }
    return 'Storages';
  };

  render () {
    const {
      storages,
      exportCsvRequest,
      storagesTable,
      summary,
      user,
      group,
      filters = {},
      storageType
    } = this.props;
    const {period, range, region: cloudRegionId} = filters;
    const composers = [
      {
        composer: ExportComposers.discountsComposer
      },
      {
        composer: ExportComposers.tableComposer,
        options: [
          exportCsvRequest,
          `${this.getTitle()} (TOP ${tablePageSize})`,
          [
            {
              key: 'owner',
              title: 'Owner'
            },
            {
              key: 'billingCenter',
              title: 'Billing Center'
            },
            {
              key: 'storageType',
              title: 'Type'
            },
            {
              key: 'region',
              title: 'Region'
            },
            {
              key: 'provider',
              title: 'Provider'
            },
            {
              key: 'created',
              title: 'Created date',
              formatter: displayDate
            }
          ],
          [
            {
              key: 'value',
              title: 'Cost',
              applyDiscounts: ({storage}) => storage,
              formatter: (value) => value ? costTickFormatter(value, '') : ''
            },
            {
              key: 'usage',
              title: 'Average Volume (GB)',
              formatter: (value) => value ? numberFormatter(value, '') : ''
            },
            {
              key: 'usageLast',
              title: 'Current Volume (GB)',
              formatter: (value) => value ? numberFormatter(value, '') : ''
            }
          ],
          'Storage',
          {
            key: 'value',
            top: tablePageSize
          }
        ]
      }
    ];
    const costsUsageSelectorHeight = 30;
    return (
      <Discounts.Consumer>
        {
          (o, storageDiscounts) => (
            <Export.Consumer
              className={styles.chartsContainer}
              composers={composers}
              exportConfiguration={{
                types: ['STORAGE'],
                user,
                group,
                period,
                range,
                filters: {
                  storage_type: storageType ? [storageType.toUpperCase()] : undefined,
                  cloudRegionId: cloudRegionId &&
                  cloudRegionId.length > 0
                    ? cloudRegionId
                    : undefined
                }
              }}
            >
              <Layout
                layout={StorageReportLayout.Layout}
                gridStyles={StorageReportLayout.GridStyles}
              >
                <div key={StorageReportLayout.Panels.summary}>
                  <Layout.Panel
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 0
                    }}
                  >
                    <BillingTable
                      storages={summary}
                      storagesDiscounts={storageDiscounts}
                      showQuota={false}
                    />
                    <ResizableContainer style={{flex: 1}}>
                      {
                        ({width, height}) => (
                          <Summary
                            storages={summary}
                            storagesDiscounts={storageDiscounts}
                            quota={false}
                            title={this.getSummaryTitle()}
                            style={{width, height}}
                          />
                        )
                      }
                    </ResizableContainer>
                  </Layout.Panel>
                </div>
                <div key={StorageReportLayout.Panels.storages}>
                  <Layout.Panel>
                    <ResizableContainer style={{width: '100%', height: '100%'}}>
                      {
                        ({height}) => (
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: costsUsageSelectorHeight
                              }}
                            >
                              <StorageFilter
                                onChange={this.onChangeDataSample}
                                value={this.state.dataSampleKey}
                              />
                            </div>
                            <BarChart
                              request={storages}
                              discounts={storageDiscounts}
                              title={this.getTitle()}
                              top={tablePageSize}
                              style={{height: height - costsUsageSelectorHeight}}
                              dataSample={
                                StorageFilters[this.state.dataSampleKey].dataSample
                              }
                              previousDataSample={
                                StorageFilters[this.state.dataSampleKey].previousDataSample
                              }
                              valueFormatter={
                                this.state.dataSampleKey === StorageFilters.value.key
                                  ? costTickFormatter
                                  : numberFormatter
                              }
                            />
                          </div>
                        )
                      }
                    </ResizableContainer>
                  </Layout.Panel>
                </div>
                <div key={StorageReportLayout.Panels.storagesTable}>
                  <Layout.Panel>
                    <ResizableContainer style={{width: '100%', height: '100%'}}>
                      {
                        ({height}) => (
                          <RenderTable
                            storages={storagesTable}
                            discounts={storageDiscounts}
                            height={height}
                          />
                        )
                      }
                    </ResizableContainer>
                  </Layout.Panel>
                </div>
              </Layout>
            </Export.Consumer>
          )
        }
      </Discounts.Consumer>
    );
  }
}

export default inject(injection)(
  Filters.attach(
    observer(StorageReports)
  )
);
