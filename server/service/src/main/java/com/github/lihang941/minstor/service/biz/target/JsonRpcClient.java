package com.github.lihang941.minstor.service.biz.target;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.github.lihang941.minstor.service.biz.target.vo.*;
import com.github.lihang941.minstor.service.config.WebclientProperties;
import com.github.lihang941.minstor.service.utils.WebUtils;
import com.github.lihang941.tool.common.exception.ErrorMsgException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.function.Consumer;

@Slf4j
@Component
public class JsonRpcClient {

    private WebClient webClient;

    private String userName = "admin";
    private String password = "EbpqeFSUdCPL5hJz";

    public JsonRpcClient(WebclientProperties webclientProperties) {
        this.webClient = WebUtils.webClientFactory(null, webclientProperties.getRequest(), webclientProperties.getResponse(), null);
    }


    public WebClient.ResponseSpec send(String baseUrl, String method, Object params) {
        throw new ErrorMsgException("send failure");
//        return webClient.post()
//                .uri(baseUrl + "/targetrpc")
//                .header("Authorization", "Basic YWRtaW46RWJwcWVGU1VkQ1BMNWhKeg==")
//                .contentType(MediaType.APPLICATION_JSON)
//                .bodyValue(new JsonRpcRequestVo().setMethod(method).setParams(params))
//                .retrieve();
    }


    public Mono<JsonRpcResultVo> exportCreate(String baseUrl, ExportCreate exportCreate) {
        return send(baseUrl, "export_create", exportCreate)
                .bodyToMono(JsonRpcResultVo.class).doOnNext(getRpcResultVoConsumer());
    }

    public Mono<JsonRpcResultVo> exportDestroy(String baseUrl, ExportDestroy exportDestroy) {
        return send(baseUrl, "export_destroy", exportDestroy)
                .bodyToMono(JsonRpcResultVo.class).doOnNext(getRpcResultVoConsumer());
    }

    public Mono<ExportList> exportList(String baseUrl) {
        return send(baseUrl, "export_list", new HashMap<>())
                .bodyToMono(ExportList.class).doOnNext(getRpcResultVoConsumer());
    }


    public Mono<NfsList> nfsList(String baseUrl) {
        return send(baseUrl, "nfs_export_list", new HashMap<>())
                .bodyToMono(NfsList.class)
                .doOnNext(getRpcResultVoConsumer());
    }

    public Mono<JsonRpcResultVo> nfsRemove(String baseUrl, NfsRemove nfsRemove) {
        return send(baseUrl, "nfs_export_remove", nfsRemove)
                .bodyToMono(JsonRpcResultVo.class)
                .doOnNext(getRpcResultVoConsumer());
    }

    public Mono<JsonRpcResultVo> nfsCreate(String baseUrl, NfsCreate nfsCreate) {
        return send(baseUrl, "nfs_export_add", nfsCreate)
                .bodyToMono(JsonRpcResultVo.class)
                .doOnNext(getRpcResultVoConsumer());
    }

    private Consumer<JsonRpcResultVo> getRpcResultVoConsumer() {
        return i -> {
            if (i.getError() != null) {
                try {
                    if (i.getError() != null) {
                        log.warn("api request failed result :{}", JSON.toJSONString(i));
                        throw new ErrorMsgException("Request failed {code} \n {msg} ").setParams(new HashMap<String, String>() {
                            {
                                put("code", i.getError().getCode().toString());
                                put("msg", i.getError().getMessage());
                            }
                        });
                    }
                } catch (ErrorMsgException e) {
                    throw e;
                }
            }
        };
    }


}
