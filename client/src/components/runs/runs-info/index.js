/*
 * Copyright 2017-2024 EPAM Systems, Inc. (https://www.epam.com/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {inject, observer} from 'mobx-react';
import {computed, observable} from 'mobx';
import {
  Select,
  message,
  Button
} from 'antd';
import RunsInfoChart from './runs-info-chart';
import ThemedReport from '../../billing/reports/themed-report';
import RunsChartsInfo from '../../../models/pipelines/RunsChartsInfo';
import {
  getDatasetStyles,
  STATUSES,
  formatDockerImages,
  formatDockerImage,
  formatUserName,
  extractDatasets
} from './utils';

const LABELS_THRESHOLD = 25;

@inject('reportThemes', 'usersInfo')
@observer
class RunsInfo extends React.PureComponent {
  @observable _filteredStatistics;
  @observable _filtersConfiguration;
  @observable _pending = false;

  componentDidMount () {
    (this.fetchFiltersConfiguration)();
    (this.fetchStatistics)();
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    if (prevProps.filters !== this.props.filters) {
      (this.fetchStatistics)();
    }
  }

  @computed
  get filtersConfiguration () {
    return this._filtersConfiguration || {};
  }

  @computed
  get filteredStatistics () {
    return this._filteredStatistics || {};
  }

  @computed
  get pending () {
    return this._pending;
  }

  @computed
  get users () {
    const {usersInfo} = this.props;
    if (usersInfo.loaded) {
      return usersInfo.value || [];
    }
    return [];
  }

  get filtersApplied () {
    const {
      filters = {}
    } = this.props;
    const {
      owners = [],
      instanceTypes = [],
      tags = [],
      dockerImages = [],
      statuses = []
    } = filters;
    return [
      owners,
      instanceTypes,
      tags,
      dockerImages,
      statuses
    ].some(filter => filter.length > 0);
  }

  fetchFiltersConfiguration = async () => {
    const request = new RunsChartsInfo();
    this._pending = true;
    await request.send({});
    if (request.error) {
      return message.error(request.error, 5);
    }
    this._filtersConfiguration = Object
      .entries(request.value || {})
      .reduce((acc, [key, value = {}]) => {
        acc[key] = [...new Set([
          ...Object.keys(value.PAUSED || {}),
          ...Object.keys(value.RUNNING || {})
        ])];
        return acc;
      }, {});
    this._pending = false;
  };

  fetchStatistics = async () => {
    const {
      filters = {}
    } = this.props;
    const {
      owners,
      instanceTypes,
      tags,
      dockerImages,
      statuses
    } = filters;
    const request = new RunsChartsInfo();
    this._pending = true;
    await request.send({
      owners,
      instanceTypes,
      tags,
      dockerImages,
      statuses
    });
    if (request.error) {
      return message.error(request.error, 5);
    }
    this._filteredStatistics = request.value;
    this._pending = false;
  };

  clearFilters = () => {
    const {onFiltersChange} = this.props;
    if (typeof onFiltersChange === 'function') {
      onFiltersChange(undefined);
    }
  };

  renderFilters = () => {
    const {
      filters = {},
      onFiltersChange
    } = this.props;
    const {
      owners = [],
      dockerImages = [],
      instanceTypes = [],
      tags = []
    } = this.filtersConfiguration;
    const onChangeFilter = (filterKey) => (values) => {
      if (typeof onFiltersChange === 'function') {
        onFiltersChange({
          ...filters,
          [filterKey]: values
        });
      }
    };
    return (
      <div style={{display: 'flex', alignItems: 'flex-start', gap: 5}}>
        <Select
          allowClear
          mode="multiple"
          style={{minWidth: 200}}
          placeholder="Statuses"
          value={filters.statuses}
          onChange={onChangeFilter('statuses')}
        >
          {Object.keys(STATUSES).map(status => (
            <Select.Option key={status} value={status}>
              {`${status[0]}${status.substring(1).toLowerCase()}`}
            </Select.Option>
          ))}
        </Select>
        {owners.length ? (
          <Select
            allowClear
            mode="multiple"
            style={{minWidth: 200}}
            placeholder="Owners"
            value={filters.owners}
            onChange={onChangeFilter('owners')}
          >
            {owners.map(owner => (
              <Select.Option key={owner} value={owner}>
                {formatUserName(owner, this.users)}
              </Select.Option>
            ))}
          </Select>
        ) : null}
        {instanceTypes.length ? (
          <Select
            allowClear
            mode="multiple"
            style={{minWidth: 200}}
            placeholder="Instance types"
            value={filters.instanceTypes}
            onChange={onChangeFilter('instanceTypes')}
          >
            {instanceTypes.map(instance => (
              <Select.Option key={instance} value={instance}>
                {instance}
              </Select.Option>
            ))}
          </Select>
        ) : null}
        {dockerImages.length ? (
          <Select
            allowClear
            mode="multiple"
            style={{minWidth: 200}}
            placeholder="Docker images"
            value={filters.dockerImages}
            onChange={onChangeFilter('dockerImages')}
          >
            {dockerImages.map(docker => (
              <Select.Option
                key={docker}
                value={docker}
                title={formatDockerImage(docker)}
              >
                {formatDockerImage(docker)}
              </Select.Option>
            ))}
          </Select>
        ) : null}
        {tags.length ? (
          <Select
            allowClear
            mode="multiple"
            style={{minWidth: 200}}
            placeholder="Tags"
            value={filters.tags}
            onChange={onChangeFilter('tags')}
          >
            {tags.map(tag => (
              <Select.Option key={tag} value={tag}>
                {tag}
              </Select.Option>
            ))}
          </Select>
        ) : null}
        {this.filtersApplied ? (
          <a style={{lineHeight: '28px', whiteSpace: 'nowrap'}} onClick={this.clearFilters}>
            Clear filters
          </a>
        ) : null}
        <Button
          onClick={this.fetchStatistics}
          style={{marginLeft: 'auto'}}
        >
          Refresh
        </Button>
      </div>
    );
  };

  onEntryClick (entry, field) {
    const {filters = {}} = this.props;
    const detailsFilters = {
      ...(filters || {}),
      [field]: [entry]
    };
    if (!detailsFilters.statuses || detailsFilters.statuses.length === 0) {
      detailsFilters.statuses = [
        'RUNNING',
        'PAUSING',
        'PAUSED',
        'RESUMING'
      ];
    }
    const {
      onApplyFilters
    } = this.props;
    if (typeof onApplyFilters === 'function') {
      onApplyFilters(detailsFilters);
    }
  }

  render () {
    const {reportThemes, className, style} = this.props;
    const {
      owners,
      dockerImages,
      instanceTypes,
      tags
    } = extractDatasets(this.filteredStatistics);
    const determineWidth = (labels = []) => labels.length > LABELS_THRESHOLD
      ? '100%'
      : '50%';
    const charts = [{
      key: 'owners',
      title: 'Owners',
      data: owners
    }, {
      key: 'instanceTypes',
      title: 'Instance types',
      data: instanceTypes
    }, {
      key: 'tags',
      title: 'Tags',
      data: tags
    }, {
      key: 'dockerImages',
      title: 'Docker images',
      data: dockerImages
    }];
    return (
      <div
        className={classNames('cp-panel', 'cp-panel-transparent', className)}
        style={{...(style || {}), display: 'flex', flexDirection: 'column'}}
      >
        {this.renderFilters()}
        <div style={{display: 'flex', flexWrap: 'wrap'}}>
          {charts.map(({title, data, key}) => {
            const {labels, ...rest} = data;
            const dataSets = Object
              .entries(rest || {})
              .map(([key, dataset]) => ({
                label: key,
                data: dataset,
                ...getDatasetStyles(key, reportThemes, {title, data, key})
              }));
            let formattedLabels = labels;
            if (key === 'dockerImages') {
              formattedLabels = formatDockerImages(labels);
            } else if (key === 'owners') {
              formattedLabels = labels.map((user) => formatUserName(user, this.users));
            }
            return (
              <RunsInfoChart
                key={key}
                loading={this.pending}
                title={title}
                data={{
                  labels: formattedLabels,
                  datasets: dataSets,
                  entries: labels
                }}
                style={{width: determineWidth(labels)}}
                onEntryClick={(entry) => this.onEntryClick(entry, key)}
              />
            );
          })}
        </div>
      </div>
    );
  }
}

RunsInfo.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  onApplyFilters: PropTypes.func,
  filters: PropTypes.object,
  onFiltersChange: PropTypes.func
};

const RunsInfoWithThemes = (props) => {
  return (
    <ThemedReport>
      <RunsInfo {...props} />
    </ThemedReport>
  );
};

export default RunsInfoWithThemes;
