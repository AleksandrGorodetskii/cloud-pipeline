/*
 * Copyright 2017-2021 EPAM Systems, Inc. (https://www.epam.com/)
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
import {
  Alert,
  Icon,
  Select
} from 'antd';
import LoadVSCommits from '../../../models/versioned-storage/load-commits';
import styles from './vs-versions-select.css';

function loadVersions (repository, page = 0) {
  const request = new LoadVSCommits(repository, page);
  return new Promise((resolve, reject) => {
    request
      .send({})
      .then(() => {
        if (request.error) {
          throw new Error(request.error);
        } else if (!request.loaded) {
          throw new Error('Error fetching repository versions');
        } else {
          const {
            listing = [],
            has_next: hasMore
          } = request.value;
          resolve({
            hasMore,
            versions: listing.slice()
          });
        }
      })
      .catch(reject);
  });
}

class VSVersions extends React.Component {
  state = {
    error: undefined,
    pending: false,
    versions: [],
    page: 0,
    hasMore: false,
    visible: false
  };

  componentDidMount () {
    this.fetchRepositoryVersions();
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    if (prevProps.repository !== this.props.repository) {
      this.fetchRepositoryVersions();
    } else if (prevProps.value !== this.props.value) {
      this.updateRepositoryVersion();
    }
  }

  appendPage = (page) => {
    const {repository} = this.props;
    return new Promise((resolve) => {
      this.setState({
        pending: true,
        error: undefined,
        page
      }, () => {
        loadVersions(repository, page)
          .then((payload) => {
            const {
              versions: currentVersions = []
            } = this.state;
            const {
              hasMore,
              versions
            } = payload || {};
            this.setState({
              pending: false,
              error: undefined,
              versions: [...currentVersions, ...versions],
              hasMore
            });
          })
          .catch(e => this.setState({
            pending: false,
            error: e.message,
            versions: [],
            hasMore: false
          }))
          .then(resolve);
      });
    });
  };

  updateRepositoryVersion = () => {
    const {value: version} = this.props;
    this.setState({
      version
    });
  };

  fetchRepositoryVersions = () => {
    this.setState({
      versions: []
    }, () => {
      this.appendPage(0)
        .then(() => {
          const {
            versions = []
          } = this.state;
          const {
            value: version,
            setFirstVersionByDefault
          } = this.props;
          if (setFirstVersionByDefault && !version && versions.length > 0) {
            const {onChange} = this.props;
            onChange && onChange(versions[0].commit);
          }
        });
    });
  };

  loadMore = (e) => {
    const {pending} = this.state;
    if (!pending) {
      e && e.preventDefault();
      e && e.stopPropagation();
      const {page = 0} = this.state;
      return this.appendPage(page + 1);
    }
  };

  handleVisibility = (visible) => {
    this.setState({visible});
  };

  render () {
    const {
      className,
      value,
      onChange,
      style,
      rowClassName,
      dropdownMatchSelectWidth
    } = this.props;
    const {
      versions,
      hasMore,
      pending,
      error
    } = this.state;
    if (error) {
      return (
        <Alert type="error" message={error} />
      );
    }
    return (
      <Select
        className={className}
        value={value}
        onChange={onChange}
        size="small"
        dropdownMatchSelectWidth={dropdownMatchSelectWidth}
        style={style}
      >
        {
          versions.map((version) => (
            <Select.Option
              className={rowClassName}
              key={version.commit}
              value={version.commit}
            >
              <b>{version.commit.slice(0, 7)}</b> {version.commit_message}
            </Select.Option>
          ))
        }
        {
          hasMore && (
            <Select.Option
              className={styles.versionRow}
              disabled
              key="load more"
            >
              <div
                className={styles.loadMore}
                onClick={this.loadMore}
              >
                {
                  pending && (
                    <Icon type="loading" />
                  )
                }
                <i>
                  Load more
                </i>
              </div>
            </Select.Option>
          )
        }
      </Select>
    );
  }
}

VSVersions.propTypes = {
  className: PropTypes.string,
  rowClassName: PropTypes.string,
  dropdownMatchSelectWidth: PropTypes.bool,
  setFirstVersionByDefault: PropTypes.bool,
  repository: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  value: PropTypes.string,
  onChange: PropTypes.func,
  style: PropTypes.object
};

VSVersions.defaultProps = {
  dropdownMatchSelectWidth: false,
  setFirstVersionByDefault: false
};

export default VSVersions;
