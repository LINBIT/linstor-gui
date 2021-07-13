package com.github.lihang941.minstor.service.biz.linstor;

import com.github.lihang941.minstor.service.biz.linstor.vo.LinstorTypes;
import com.github.lihang941.minstor.service.biz.linstor.vo.ListOpts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import static com.github.lihang941.minstor.service.utils.UrlUtils.buildQueryParam;

@Component
public class ResourceDefinitionClient {

    @Autowired
    private WebClient webClient;

    public Flux<LinstorTypes.ResourceDefinition> getAll(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-definitions", listOpts).build())
                .retrieve()
                .bodyToFlux(LinstorTypes.ResourceDefinition.class);
    }

    public Mono<LinstorTypes.ResourceDefinition> get(String resDefName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-definitions/{resDefName}", listOpts).build(resDefName))
                .retrieve()
                .bodyToMono(LinstorTypes.ResourceDefinition.class);
    }

    public Mono<String> create(LinstorTypes.ResourceDefinitionCreate resourceDefinitionCreate) {
        return webClient.post()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-definitions").build())
                .bodyValue(resourceDefinitionCreate)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> modify(String resDefName, LinstorTypes.ResourceDefinitionModify resourceDefinitionModify) {
        return webClient.put()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-definitions/{resDefName}").build(resDefName))
                .bodyValue(resourceDefinitionModify)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> delete(String resDefName) {
        return webClient.delete()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-definitions/{resDefName}").build(resDefName))
                .retrieve()
                .bodyToMono(String.class);
    }

    public Flux<LinstorTypes.VolumeDefinition> getVolumeDefinitions(String resDefName) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-definitions/{resDefName}/volume-definitions").build(resDefName))
                .retrieve()
                .bodyToFlux(LinstorTypes.VolumeDefinition.class);
    }

    public Mono<LinstorTypes.VolumeDefinition> getVolumeDefinition(String resDefName, Integer volNr) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-definitions/{resDefName}/volume-definitions/{volNr}").build(resDefName, volNr))
                .retrieve()
                .bodyToMono(LinstorTypes.VolumeDefinition.class);
    }

    public Mono<String> createVolumeDefinition(String resDefName, LinstorTypes.VolumeDefinitionCreate volDef) {
        return webClient.post()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-definitions/{resDefName}/volume-definitions").build(resDefName))
                .bodyValue(volDef)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> modifyVolumeDefinition(String resDefName, Integer volNr, LinstorTypes.VolumeDefinitionModify props) {
        return webClient.put()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-definitions/{resDefName}/volume-definitions/{volNr}").build(resDefName, volNr))
                .bodyValue(props)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> deleteVolumeDefinition(String resDefName, Integer volNr) {
        return webClient.delete()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-definitions/{resDefName}/volume-definitions/{volNr}").build(resDefName, volNr))
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> activate(String resDefName, String nodeName) {

        return webClient.post()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-definitions/{resDefName}/resources/{nodeName}/activate").build(resDefName, nodeName))
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> deactivate(String resDefName, String nodeName) {

        return webClient.post()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-definitions/{resDefName}/resources/{nodeName}/deactivate").build(resDefName, nodeName))
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> delete(String resDefName, String nodeName) {
        return webClient.delete()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-definitions/{resDefName}/resources/{nodeName}").build(resDefName, nodeName))
                .retrieve()
                .bodyToMono(String.class);
    }
}


