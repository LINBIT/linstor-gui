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
public class ResourceGroupClient {

    @Autowired
    private WebClient webClient;

    public Flux<LinstorTypes.ResourceGroup> getAll(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-groups", listOpts).build())
                .retrieve()
                .bodyToFlux(LinstorTypes.ResourceGroup.class);
    }

    public Mono<LinstorTypes.ResourceGroup> get(String resGrpName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-groups/{resGrpName}", listOpts).build(resGrpName))
                .retrieve()
                .bodyToMono(LinstorTypes.ResourceGroup.class);
    }

    public Mono<String> create(LinstorTypes.ResourceGroup resourceGroup) {
        return webClient.post()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-groups").build())
                .bodyValue(resourceGroup)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> modify(String resGrpName, LinstorTypes.ResourceGroupModify resourceGroupModify) {
        return webClient.put()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-groups/{resGrpName}").build(resGrpName))
                .bodyValue(resourceGroupModify)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> delete(String resGrpName) {
        return webClient.delete()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-groups/{resGrpName}").build(resGrpName))
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> spawn(String resGrpName, LinstorTypes.ResourceGroupSpawn resourceGroupSpawn) {
        return webClient.post()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-groups/{resGrpName}/spawn").build(resGrpName))
                .bodyValue(resourceGroupSpawn)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Flux<LinstorTypes.VolumeGroup> getVolumeGroups(String resGrpName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-groups/{resGrpName}/volume-groups", listOpts).build(resGrpName))
                .retrieve()
                .bodyToFlux(LinstorTypes.VolumeGroup.class);
    }

    public Mono<LinstorTypes.VolumeGroup> getVolumeGroup(String resGrpName, Integer volNr, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-groups/{resGrpName}/volume-groups/{volNr}", listOpts).build(resGrpName, volNr))
                .retrieve()
                .bodyToMono(LinstorTypes.VolumeGroup.class);
    }

    public Mono<String> createVolumeGroup(String resGrpName, LinstorTypes.VolumeGroup volGrp) {
        return webClient.post()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-groups/{resGrpName}/volume-groups/").build(resGrpName))
                .bodyValue(volGrp)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> modifyVolumeGroup(String resGrpName, Integer volNr, LinstorTypes.VolumeGroupModify props) {
        return webClient.put()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-groups/{resGrpName}/volume-groups/{volNr}").build(resGrpName, volNr))
                .bodyValue(props)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> deleteVolumeGroup(String resGrpName, Integer volNr) {
        return webClient.delete()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/resource-groups/{resGrpName}/volume-groups/{volNr}").build(resGrpName, volNr))
                .retrieve()
                .bodyToMono(String.class);
    }

}

