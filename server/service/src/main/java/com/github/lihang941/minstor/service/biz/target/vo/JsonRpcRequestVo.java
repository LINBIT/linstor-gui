package com.github.lihang941.minstor.service.biz.target.vo;

import lombok.Data;
import lombok.experimental.Accessors;

@Accessors(chain = true)
@Data
public class JsonRpcRequestVo {
    private String id = "1";
    private String method;
    private Object params;
    private String jsonrpc = "2.0";
}
