package com.github.lihang941.minstor.service.biz.linstor;

import com.github.lihang941.minstor.service.biz.linstor.vo.LinstorTypes;
import com.github.lihang941.minstor.service.biz.linstor.vo.ListOpts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

import static com.github.lihang941.minstor.service.utils.UrlUtils.buildQueryParam;

@Component
public class ControllerClient {

    @Autowired
    private WebClient webClient;

    public Mono<LinstorTypes.ControllerVersion> getVersion(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/controller/version", listOpts).build())
                .retrieve()
                .bodyToMono(LinstorTypes.ControllerVersion.class);
    }

    public Mono<LinstorTypes.ControllerConfig> getConfig(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/controller/config", listOpts).build())
                .retrieve()
                .bodyToMono(LinstorTypes.ControllerConfig.class);
    }


    public Mono<String> modify(LinstorTypes.ControllerPropsModify controllerPropsModify) {
        return webClient.post()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/controller/properties").build())
                .bodyValue(controllerPropsModify)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<Map<String, String>> getProps(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/controller/properties", listOpts).build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, String>>() {
                });
    }


    public Mono<String> deleteProp(String prop) {
        return webClient.delete()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/controller/properties/{prop}").build(prop))
                .retrieve()
                .bodyToMono(String.class);
    }

    public Flux<LinstorTypes.ErrorReport> getErrorReports(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/error-reports", listOpts).build())
                .retrieve()
                .bodyToFlux(LinstorTypes.ErrorReport.class);
    }

    public Mono<String> deleteErrorReports(LinstorTypes.ErrorReportDelete errorReportDelete) {
        return webClient.patch()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/error-reports").build())
                .bodyValue(errorReportDelete)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Flux<LinstorTypes.ErrorReport> getErrorReportsSince(Long since, ListOpts listOpts) {
        Map<Object, Object> params = new HashMap<Object, Object>() {
            {
                put("since", since);
            }
        };
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/error-reports", params, listOpts).build())
                .retrieve()
                .bodyToFlux(LinstorTypes.ErrorReport.class);
    }

    public Flux<LinstorTypes.ErrorReport> getErrorReport(String id, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/error-reports/{id}", listOpts).build(id))
                .retrieve()
                .bodyToFlux(LinstorTypes.ErrorReport.class);
    }


    public Mono<String> createSOSReport(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/sos-report", listOpts).build())
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> downloadSOSReport(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/sos-report/download", listOpts).build())
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<LinstorTypes.SatelliteConfig> getSatelliteConfig(String node) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/nodes/{node}/config").build(node))
                .retrieve()
                .bodyToMono(LinstorTypes.SatelliteConfig.class);
    }

    public Mono<String> modifySatelliteConfig(String node, LinstorTypes.SatelliteConfig satelliteConfig) {
        return webClient.put()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/nodes/{node}/config").build(node))
                .bodyValue(satelliteConfig)
                .retrieve()
                .bodyToMono(String.class);
    }


    public Mono<String> modifyConfig(LinstorTypes.ControllerConfig controllerConfig) {
        return webClient.put()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/controller/config").build())
                .bodyValue(controllerConfig)
                .retrieve()
                .bodyToMono(String.class);
    }
}
