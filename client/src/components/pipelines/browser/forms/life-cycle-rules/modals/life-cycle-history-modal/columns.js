/*
 * Copyright 2017-2022 EPAM Systems, Inc. (https://www.epam.com/)
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
import {DESTINATIONS} from '../life-cycle-edit-modal';
import displayDate from '../../../../../../../utils/displayDate';

const FORMAT = 'YYYY-MM-DD';

const columns = [{
  title: 'Date',
  dataIndex: 'date',
  key: 'date',
  render: (aDate) => displayDate(aDate)
}, {
  title: 'Action',
  dataIndex: 'action',
  key: 'action'
}, {
  title: 'User',
  dataIndex: 'user',
  key: 'user'
}, {
  title: 'Path',
  dataIndex: 'file',
  key: 'file'
}, {
  title: 'Destination',
  dataIndex: 'destination',
  key: 'destination',
  render: (destination) => (
    <span
      className={destination === DESTINATIONS.DELETION
        ? 'cp-error'
        : ''
      }
    >
      {destination}
    </span>
  )
}, {
  title: 'Prolongation, days',
  dataIndex: 'prolongation',
  key: 'prolongation'
}, {
  title: 'Renewed transition',
  dataIndex: 'transition',
  key: 'transition',
  render: (aDate) => displayDate(aDate, FORMAT)
}];

export default columns;