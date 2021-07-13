package com.github.lihang941.minstor.service.utils;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.lihang941.minstor.service.biz.linstor.vo.ApiError;
import com.github.lihang941.tool.common.exception.ErrorMsgException;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;

public class WebUtils {

    private static Logger log = LoggerFactory.getLogger(WebUtils.class);

    public static String getIpAddress(ServerHttpRequest request) {
        HttpHeaders headers = request.getHeaders();
        String ip = headers.getFirst("x-forwarded-for");
        if (ip != null && ip.length() != 0 && !"unknown".equalsIgnoreCase(ip)) {
            if (ip.indexOf(",") != -1) {
                ip = ip.split(",")[0];
            }
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = headers.getFirst("Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = headers.getFirst("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = headers.getFirst("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = headers.getFirst("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = headers.getFirst("X-Real-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddress().getAddress().getHostAddress();
        }
        return ip;
    }


    public static DataBuffer getBodyBuffer(ObjectMapper objectMapper, ServerHttpResponse response, Object result) {
        try {
            DataBufferFactory bufferFactory = response.bufferFactory();
            DataBuffer buffer = bufferFactory.allocateBuffer();
            byte[] bytes = objectMapper.writeValueAsBytes(result);
            buffer.write(bytes);
            return buffer;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static Mono<Void> writeJson(ObjectMapper objectMapper, ServerWebExchange exchange, HttpStatus httpStatus, Object result) {
        exchange.getResponse()
                .setStatusCode(httpStatus);
        Mono<Void> voidMono = exchange.getResponse().writeWith(Flux.just(WebUtils.getBodyBuffer(objectMapper, exchange.getResponse(), result)));
        exchange.getResponse().getHeaders().set("Content-Type", "application/json;charset=utf-8");
        return voidMono;
    }


    public static WebClient webClientFactory(String baseUrl, boolean requestFilter, boolean responseFilter, ExchangeFilterFunction exchangeFilterFunction) {
        WebClient.Builder builder = WebClient.builder();
        if (StringUtils.isNotBlank(baseUrl)) {
            builder.baseUrl(baseUrl);
        }
        if (requestFilter) {
            builder.filter(logRequest());
        }
        if (responseFilter) {
            builder.filter(logResponse());
        }
        if (exchangeFilterFunction != null) {
            builder.filter(exchangeFilterFunction);
        }
        WebClient build = builder.build();
        return build;
    }

    private static ExchangeFilterFunction logRequest() {
        return (clientRequest, next) -> {
            log.info("Request: {} {}", clientRequest.method(), clientRequest.url());
            clientRequest.headers()
                    .forEach((name, values) -> values.forEach(value -> log.info("{}={}", name, value)));
            return next.exchange(clientRequest);
        };
    }

    private static ExchangeFilterFunction logResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
            log.info("Response: {}", clientResponse.headers().asHttpHeaders().get("property-header"));
            return Mono.just(clientResponse);
        });
    }


    public static ExchangeFilterFunction linstorErrorResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
            if (!clientResponse.statusCode().is2xxSuccessful()) {
                return clientResponse.bodyToMono(String.class)
                        .doOnNext(it -> {
                            log.warn("api request failed status:{} result:{}", clientResponse.statusCode().value(), it);
                            try {

                                List<ApiError> apiErrors = JSON.parseArray(it, ApiError.class);
                                if (apiErrors.size() > 0) {
                                    throw new ErrorMsgException("Request failed {msg} \n {details}").setParams(new HashMap<String, String>() {
                                        {
                                            put("msg", apiErrors.get(0).getMessage());
                                            put("details", apiErrors.get(0).getDetails());
                                        }
                                    });
                                } else {
                                    throw new ErrorMsgException("Request failed");
                                }
                            } catch (ErrorMsgException e) {
                                throw e;
                            } catch (Exception e) {
                                log.warn("Parsing failed", e);
                                throw new ErrorMsgException("Request failed");
                            }
                        }).then(Mono.just(clientResponse));
            } else {
                return Mono.just(clientResponse);
            }

        });
    }

    public static ExchangeFilterFunction rpcErrorResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
            return clientResponse.bodyToMono(String.class)
                    .doOnNext(it -> {
                        try {
                            JSONObject jsonObject = JSON.parseObject(it);
                            if (jsonObject.get("error") != null) {
                                log.warn("api request failure status:{} result:{}", clientResponse.statusCode().value(), it);
                                throw new ErrorMsgException("Request failed {code} \n {msg} ").setParams(new HashMap<String, String>() {
                                    {
                                        put("code", jsonObject.getJSONObject("error").getLong("code").toString());
                                        put("msg", jsonObject.getJSONObject("error").getString("message"));
                                    }
                                });
                            }
                        } catch (ErrorMsgException e) {
                            throw e;
                        } catch (Exception e) {
                            log.warn("请求解析失败失败", it, e);
                            throw new ErrorMsgException("Request failed");
                        }
                    }).then(Mono.just(clientResponse));

        });
    }
}
