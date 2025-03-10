/*
 * Copyright 2017-2021 EPAM Systems, Inc. (https://www.epam.com/)
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

package com.epam.pipeline.entity.datastorage;


import java.io.File;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.collections4.MapUtils;

@Getter
@Setter
public class DataStorageFile extends AbstractDataStorageItem {
    private Long size;
    private String changed;
    private String version;
    private Boolean deleteMarker;
    private Boolean isHidden = false;
    private boolean latest = true;
    private Map<String, AbstractDataStorageItem> versions;

    public DataStorageFile() {
        super();
        this.setType(DataStorageItemType.File);
    }

    public DataStorageFile copy(DataStorageFile other) {
        if (other == null) {
            return null;
        }
        DataStorageFile file = new DataStorageFile();
        file.setName(other.getName());
        file.setPath(other.getPath());
        file.setSize(other.getSize());
        file.setChanged(other.getChanged());
        file.setLabels(other.getLabels());
        file.setVersion(other.getVersion());
        file.setDeleteMarker(other.getDeleteMarker());
        file.setIsHidden(other.getIsHidden());
        file.setLatest(other.isLatest());
        return file;
    }

    public DataStorageFile copy() {
        DataStorageFile file = new DataStorageFile();
        file.setName(this.getName());
        file.setPath(this.getPath());
        file.setSize(this.getSize());
        file.setChanged(this.getChanged());
        if (MapUtils.isNotEmpty(getVersions())) {
            file.setVersions(new HashMap<>(this.getVersions()));
        }
        if (MapUtils.isNotEmpty(getLabels())) {
            file.setLabels(new HashMap<>(this.getLabels()));
        }
        file.setVersion(this.getVersion());
        file.setDeleteMarker(this.getDeleteMarker());
        file.setIsHidden(this.getIsHidden());
        file.setLatest(this.isLatest());
        return file;
    }

    public DataStorageFile(String path, File file) {
        setName(file.getName());
        setPath(path);
        setSize(file.length());
        setChanged(new Date(file.lastModified()).toString());
    }
}
