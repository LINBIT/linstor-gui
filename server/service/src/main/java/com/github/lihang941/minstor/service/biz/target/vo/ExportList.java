package com.github.lihang941.minstor.service.biz.target.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.util.List;

@NoArgsConstructor
@Data
public class ExportList extends JsonRpcResultVo<List<ExportList.Export>> {

    @Accessors(chain = true)
    @Data
    public static class Export {
        @JsonProperty("initiator_wwn")
        private String initiatorWwn;
        @JsonProperty("demo_mode_write_protect")
        private String demo_mode_write_protect;
        @JsonProperty("dev_path")
        private String devPath;
        @JsonProperty("storage_name")
        private String storageName;
        @JsonProperty("lun")
        private Integer lun;
        @JsonProperty("network")
        private List<NetworkDTO> network;

        @NoArgsConstructor
        @Data
        public static class NetworkDTO {
            @JsonProperty("ip")
            private String ip;
            @JsonProperty("port")
            private Integer port;
        }
    }
}
