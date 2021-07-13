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
public class StoragePoolDefinitionClient {
    @Autowired
    private WebClient webClient;

    public Flux<LinstorTypes.StoragePoolDefinition> getAll(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/storage-pool-definitions", listOpts).build())
                .retrieve()
                .bodyToFlux(LinstorTypes.StoragePoolDefinition.class);
    }

    public Mono<LinstorTypes.StoragePoolDefinition> get(String spdName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/storage-pool-definitions/{spName}", listOpts)
                        .build(spdName))
                .retrieve()
                .bodyToMono(LinstorTypes.StoragePoolDefinition.class);
    }

    public Mono<String> create(LinstorTypes.StoragePoolDefinition storagePoolDefinition) {
        return webClient.post()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/storage-pool-definitions")
                        .build())
                .bodyValue(storagePoolDefinition)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> modify(String spdName, LinstorTypes.StoragePoolDefinitionModify storagePoolDefinitionModify) {
        return webClient.put()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/storage-pool-definitions/{spName}")
                        .build(spdName))
                .bodyValue(storagePoolDefinitionModify)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> delete(String spdName) {
        return webClient.delete()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/storage-pool-definitions/{spName}")
                        .build(spdName))
                .retrieve()
                .bodyToMono(String.class);
    }


}
