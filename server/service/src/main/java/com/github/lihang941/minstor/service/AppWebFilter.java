package com.github.lihang941.minstor.service;

import com.github.lihang941.minstor.service.auth.Permissions;
import com.github.lihang941.minstor.service.biz.auth.AuthBiz;
import com.github.lihang941.minstor.service.config.LinstorProperties;
import com.github.lihang941.minstor.service.facade.handler.ErrorHandler;
import com.github.lihang941.minstor.service.utils.WebUtils;
import com.github.lihang941.tool.common.exception.ErrorMsgException;
import com.github.lihang941.tool.common.exception.TokenInvalidException;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.reactive.CorsUtils;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.reactive.result.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Arrays;

/**
 * @author lihang
 * @date 2020/10/19
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@Component
public class AppWebFilter implements WebFilter {

    @Autowired
    private ErrorHandler errorHandler;

    @Autowired
    private RequestMappingHandlerMapping requestMappingHandlerMapping;

    @Autowired
    private AuthBiz authBiz;

    @Autowired
    private LinstorProperties linstorProperties;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        ServerWebExchange modifiedExchange = addConstant(exchange, request);
        if (exchange.getRequest().getURI().getPath().equals("/")) {
            return chain.filter(exchange.mutate().request(exchange.getRequest().mutate().path("/index.html").build()).build());
        }
        return requestMappingHandlerMapping.getHandler(modifiedExchange)
                .filter(it -> it instanceof HandlerMethod)
                .switchIfEmpty(chain.filter(modifiedExchange))
                .flatMap(it -> checkPermissions(chain, modifiedExchange, (HandlerMethod) it));
    }

    private Mono<Void> checkPermissions(WebFilterChain chain, ServerWebExchange modifiedExchange, HandlerMethod handlerMethod) {
        try {

           /* if (linstorProperties.getReadOnly()) {
                if (modifiedExchange.getRequest().getMethod() != HttpMethod.GET) {
                    if (!StringUtils.contains(modifiedExchange.getRequest().getPath().value(), "/user")) {
                        throw new ErrorMsgException("ERROR: Read Only");
                    }
                }
            }*/
            Permissions permissions = handlerMethod.getMethodAnnotation(Permissions.class);
            if (permissions != null || StringUtils.contains(modifiedExchange.getRequest().getPath().value(), "/v1")) {
                String token = modifiedExchange.getRequest().getHeaders().getFirst(RequestConstant.HEAD_USER_TOKEN);
                if (StringUtils.isNotBlank(token)) {
                    AuthBiz.Session session = authBiz.getSession(token);
                    if (session != null) {
                        modifiedExchange = modifiedExchange.mutate()
                                .request(modifiedExchange.getRequest().mutate()
                                        .headers(httpHeader -> {
                                            httpHeader.set(RequestConstant.HEAD_USER_ID, session.getAuthVo().getUserId());
                                        }).build()).build();
                        return chain.filter(modifiedExchange);
                    }
                }
                throw new TokenInvalidException("ERROR: Token Invalid");
            }
            return chain.filter(modifiedExchange);
        } catch (Exception e) {
            return errorHandler.handleError(modifiedExchange, e);
        }

    }

    private ServerWebExchange addConstant(ServerWebExchange exchange, ServerHttpRequest request) {
        String ip = ObjectUtils.defaultIfNull(WebUtils.getIpAddress(request), "unknown");
        String userAgent = ObjectUtils.defaultIfNull(request.getHeaders().getFirst("User-Agent"), "unknown");
        ServerHttpRequest.Builder requestBuilder = exchange.getRequest().mutate()
                .headers(httpHeader -> {
                    httpHeader.set(RequestConstant.HEAD_USER_IP, ip);
                    httpHeader.set(RequestConstant.HEAD_USER_AGENT, userAgent);
                    httpHeader.remove(RequestConstant.HEAD_USER_DATA);
                    httpHeader.remove(RequestConstant.HEAD_USER_ID);
                });
        ServerWebExchange modifiedExchange = exchange.mutate()
                .request(requestBuilder.build()).build();
        return modifiedExchange;
    }


}
