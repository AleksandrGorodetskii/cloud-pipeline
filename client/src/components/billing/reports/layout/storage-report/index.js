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

import Panels from './panels';
import {defaultSizes, defaultObjectsSizes} from './default-panels-sizes';
import {defaultState, defaultObjectsState} from './default-panels-state';
import {buildGridStyle, buildLayout} from '../../../../special/grid-layout';

const GridStyles = buildGridStyle({top: 0, maxLayoutColumns: 4});

const Layout = buildLayout({
  defaultState,
  storage: 'panelsLayout-Billing-Storages-Report',
  defaultSizes,
  panelNeighbors: [],
  gridStyle: GridStyles
});

const ObjectsLayout = buildLayout({
  defaultState: defaultObjectsState,
  storage: 'panelsLayout-Billing-Storages-Report-Objects',
  defaultSizes: defaultObjectsSizes,
  panelNeighbors: [],
  gridStyle: GridStyles
});

export {GridStyles, Layout, ObjectsLayout, Panels};
