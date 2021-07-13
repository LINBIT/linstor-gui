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
public class NodeClient {

    @Autowired
    private WebClient webClient;


    public Flux<LinstorTypes.Node> getAll(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes", listOpts).build())
                .retrieve()
                .bodyToFlux(LinstorTypes.Node.class);
    }

    public Mono<LinstorTypes.Node> get(String nodeName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}", listOpts).build(nodeName))
                .retrieve()
                .bodyToMono(LinstorTypes.Node.class);
    }

    public Mono<String> create(LinstorTypes.Node node) {
        return webClient.post()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes").build())
                .bodyValue(node)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> modify(String nodeName, LinstorTypes.NodeModify nodeModifyVo) {
        return webClient.put()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}").build(nodeName))
                .bodyValue(nodeModifyVo)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> delete(String nodeName) {
        return webClient.delete()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}").build(nodeName))
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> lost(String nodeName) {
        return webClient.delete()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}/lost").build(nodeName))
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> reconnect(String nodeName) {
        return webClient.put()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}/reconnect").build(nodeName))
                .retrieve()
                .bodyToMono(String.class);
    }


    public Mono<String> restore(String nodeName) {
        return webClient.put()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}/restore").build(nodeName))
                .retrieve()
                .bodyToMono(String.class);
    }

    public Flux<LinstorTypes.NetInterface> getNetInterfaces(String nodeName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}/net-interfaces", listOpts).build(nodeName))
                .retrieve()
                .bodyToFlux(LinstorTypes.NetInterface.class);
    }

    public Mono<LinstorTypes.NetInterface> getNetInterface(String nodeName, String nifName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}/net-interfaces/{nifName}", listOpts).build(nodeName, nifName))
                .retrieve()
                .bodyToMono(LinstorTypes.NetInterface.class);
    }

    public Mono<String> createNetInterface(String nodeName, LinstorTypes.NetInterface netInterface) {
        return webClient.post()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}/net-interfaces").build(nodeName))
                .bodyValue(netInterface)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> modifyNetInterface(String nodeName, String nifName, LinstorTypes.NetInterface netInterfaces) {
        return webClient.put()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}/net-interfaces/{nifName}").build(nodeName, nifName))
                .bodyValue(netInterfaces)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> deleteNetinterface(String nodeName, String nifName) {
        return webClient.delete()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}/net-interfaces/{nifName}").build(nodeName, nifName))
                .retrieve()
                .bodyToMono(String.class);
    }

    public Flux<LinstorTypes.StoragePool> getStoragePoolView(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/view/storage-pools", listOpts).build())
                .retrieve()
                .bodyToFlux(LinstorTypes.StoragePool.class);
    }

    public Flux<LinstorTypes.StoragePool> getStoragePools(String nodeName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}/storage-pools", listOpts).build(nodeName))
                .retrieve()
                .bodyToFlux(LinstorTypes.StoragePool.class);
    }

    public Mono<LinstorTypes.StoragePool> getStoragePool(String nodeName, String spName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}/storage-pools/{spName}", listOpts).build(nodeName, spName))
                .retrieve()
                .bodyToMono(LinstorTypes.StoragePool.class);
    }

    public Mono<String> createStoragePool(String nodeName, LinstorTypes.StoragePool storagePool) {
        return webClient.post()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}/storage-pools").build(nodeName))
                .bodyValue(storagePool)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> modifyStoragePool(String nodeName, String spName, LinstorTypes.StoragePoolDefinitionModify storagePoolDefinitionModify) {
        return webClient.put()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}/storage-pools/{spName}").build(nodeName, spName))
                .bodyValue(storagePoolDefinitionModify)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> deleteStoragePool(String nodeName, String spName) {
        return webClient.delete()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/nodes/{nodeName}/storage-pools/{spName}").build(nodeName, spName))
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> metrics() {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/metrics").build())
                .retrieve()
                .bodyToMono(String.class);
    }



}
