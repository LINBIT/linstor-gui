package com.github.lihang941.minstor.service.biz.target.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

@Accessors(chain = true)
@Data
public class JsonRpcResultVo<T> {
    @JsonProperty("result")
    protected T result;
    @JsonProperty("id")
    protected Integer id;
    @JsonProperty("jsonrpc")
    protected String jsonrpc;
    private Error error;

    @NoArgsConstructor
    @Data
    public static class Error {

        @JsonProperty("code")
        private Integer code;
        @JsonProperty("message")
        private String message;
    }
}
