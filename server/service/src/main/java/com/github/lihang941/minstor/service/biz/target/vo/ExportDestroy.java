package com.github.lihang941.minstor.service.biz.target.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

@Accessors(chain = true)
@Data
public class ExportDestroy {

    @JsonProperty("vol")
    private String vol;
    @JsonProperty("initiator_wwn")
    private String initiatorWwn;
}
