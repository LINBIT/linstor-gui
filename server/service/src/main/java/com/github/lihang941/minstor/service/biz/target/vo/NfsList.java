package com.github.lihang941.minstor.service.biz.target.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.util.List;

@NoArgsConstructor
@Data
public class NfsList extends JsonRpcResultVo<List<NfsList.Nfs>> {

    @Accessors(chain = true)
    @Data
    public static class Nfs {
        /**
         * host : 192.168.122.70
         * path : /nfs/drbd1000
         * options : ["secure","rw","no_subtree_check","wdelay","no_root_squash","no_all_squash","sec=sys"]
         */
        @JsonProperty("host")
        private String host;
        @JsonProperty("path")
        private String path;
        @JsonProperty("options")
        private List<String> options;
    }

}
