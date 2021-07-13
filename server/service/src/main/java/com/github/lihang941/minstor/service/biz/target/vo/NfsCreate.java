package com.github.lihang941.minstor.service.biz.target.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.util.List;

@Accessors(chain = true)
@Data
public class NfsCreate {

    /**
     * host : 192.168.122.70
     * drive : drbd1000
     * options : ["rw","no_root_squash","sync"]
     * chown : null
     */

    @JsonProperty("host")
    private String host;
    @JsonProperty("drive")
    private String drive;
    @JsonProperty("chown")
    private Object chown;
    @JsonProperty("options")
    private List<String> options;
}
