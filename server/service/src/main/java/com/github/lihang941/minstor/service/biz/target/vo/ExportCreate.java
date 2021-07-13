package com.github.lihang941.minstor.service.biz.target.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.experimental.Accessors;

@Accessors(chain = true)
@Data
public class ExportCreate {
    @JsonProperty("vol")
    private String vol;
    @JsonProperty("initiator_wwn")
    private String initiatorWwn;
    @JsonProperty("lun")
    private Integer lun;
    @JsonProperty("ip")
    private String ip;
    @JsonProperty("port")
    private Integer port;
    @JsonProperty("demo_mode_write_protect")
    private Integer demo_mode_write_protect;
}
