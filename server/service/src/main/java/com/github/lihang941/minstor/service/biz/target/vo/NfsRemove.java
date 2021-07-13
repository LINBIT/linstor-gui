package com.github.lihang941.minstor.service.biz.target.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.experimental.Accessors;

@Accessors(chain = true)
@Data
public class NfsRemove {

    /**
     * host : 192.168.122.70
     * drive : drbd1000
     */

    @JsonProperty("host")
    private String host;
    @JsonProperty("drive")
    private String drive;
}
