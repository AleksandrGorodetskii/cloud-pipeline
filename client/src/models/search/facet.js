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

import RemotePost from '../basic/RemotePost';
import mapElasticDocument from './map-elastic-document';

class FacetSearch extends RemotePost {
  constructor () {
    super();
    this.url = '/search/facet';
  }

  postprocess (value) {
    if (value && value.payload && value.payload.documents) {
      value.payload.documents = (value.payload.documents || []).map(mapElasticDocument);
    }
    return value.payload;
  }
}

export default FacetSearch;
