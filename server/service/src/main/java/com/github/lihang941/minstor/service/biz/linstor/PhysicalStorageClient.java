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
public class PhysicalStorageClient {

    @Autowired
    private WebClient webClient;

    public Flux<LinstorTypes.PhysicalStorage> getPhysicalStorage(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/physical-storage/", listOpts).build())
                .retrieve()
                .bodyToFlux(LinstorTypes.PhysicalStorage.class);
    }

    public Mono<String> createDevicePool(String nodeName, LinstorTypes.PhysicalStorageCreate physicalStorageCreate) {
        return webClient.post()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/physical-storage/{nodeName}").build(nodeName))
                .bodyValue(physicalStorageCreate)
                .retrieve()
                .bodyToMono(String.class);
    }

}
