/*
 * Copyright 2017-2022 EPAM Systems, Inc. (https://www.epam.com/)
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

import moment from 'moment-timezone';

function asStringArray (array) {
  return (array || []).map((item) => `${item}`);
}

export function simpleArraysAreEqual (array1, array2) {
  const a = [...new Set(asStringArray(array1))].sort();
  const b = [...new Set(asStringArray(array2))].sort();
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function isUndefined (o) {
  return o === undefined || o === null;
}

function asMomentDate (date) {
  if (isUndefined(date)) {
    return undefined;
  }
  const momentDate = moment.utc(date);
  if (momentDate.isValid()) {
    return momentDate;
  }
  return undefined;
}

export function datesAreEqual (date1, date2) {
  const a = asMomentDate(date1);
  const b = asMomentDate(date2);
  if (isUndefined(a) && isUndefined(b)) {
    return true;
  }
  if (isUndefined(a) || isUndefined(b)) {
    return false;
  }
  return a.isSame(b);
}

export function statusesArraysAreEqual (array1, array2) {
  return simpleArraysAreEqual(array1, array2);
}

export function parentIdsAreEqual (parentId1, parentId2) {
  if (isUndefined(parentId1) && isUndefined(parentId2)) {
    return true;
  }
  if (isUndefined(parentId1) || isUndefined(parentId2)) {
    return false;
  }
  return Number(parentId1) === Number(parentId2);
}

export function projectsArraysAreEqual (array1, array2) {
  return simpleArraysAreEqual(array1, array2);
}

export function pipelineIdArraysAreEqual (array1, array2) {
  return simpleArraysAreEqual(array1, array2);
}

export function versionArraysAreEqual (array1, array2) {
  return simpleArraysAreEqual(array1, array2);
}

export function dockerImagesArraysAreEqual (array1, array2) {
  return simpleArraysAreEqual(array1, array2);
}

export function startDatesAreEqual (startDate1, startDate2) {
  return datesAreEqual(startDate1, startDate2);
}

export function endDatesAreEqual (endDate1, endDate2) {
  return datesAreEqual(endDate1, endDate2);
}

export function ownerArraysAreEqual (array1, array2) {
  return simpleArraysAreEqual(array1, array2);
}

export function filtersAreEqual (filter1, filter2) {
  const {
    statuses: statusesA,
    parentId: parentIdA,
    pipelineIds: pipelineIdsA,
    versions: versionsA,
    dockerImages: dockerImagesA,
    startDateFrom: startDateFromA,
    endDateTo: endDateToA,
    owners: ownersA,
    projectIds: projectIdsA
  } = filter1 || {};
  const {
    statuses: statusesB,
    parentId: parentIdB,
    pipelineIds: pipelineIdsB,
    versions: versionsB,
    dockerImages: dockerImagesB,
    startDateFrom: startDateFromB,
    endDateTo: endDateToB,
    owners: ownersB,
    projectIds: projectIdsB
  } = filter2 || {};
  return statusesArraysAreEqual(statusesA, statusesB) &&
    parentIdsAreEqual(parentIdA, parentIdB) &&
    pipelineIdArraysAreEqual(pipelineIdsA, pipelineIdsB) &&
    versionArraysAreEqual(versionsA, versionsB) &&
    projectsArraysAreEqual(projectIdsA, projectIdsB) &&
    dockerImagesArraysAreEqual(dockerImagesA, dockerImagesB) &&
    startDatesAreEqual(startDateFromA, startDateFromB) &&
    endDatesAreEqual(endDateToA, endDateToB) &&
    ownerArraysAreEqual(ownersA, ownersB);
}

export function getFiltersPayload (filters) {
  const {
    startDateFrom,
    endDateTo,
    ...rest
  } = filters || {};
  const formatDate = (date) => date
    ? (moment.utc(date).format('YYYY-MM-DD HH:mm:ss.SSS'))
    : undefined;
  return {
    ...rest,
    startDateFrom: formatDate(startDateFrom),
    endDateTo: formatDate(endDateTo)
  };
}
