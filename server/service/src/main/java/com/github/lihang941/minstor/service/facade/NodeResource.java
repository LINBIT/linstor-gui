package com.github.lihang941.minstor.service.facade;

import com.github.lihang941.minstor.service.biz.linstor.NodeClient;
import com.github.lihang941.minstor.service.biz.linstor.vo.LinstorTypes;
import com.github.lihang941.minstor.service.biz.linstor.vo.ListOpts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;


@RestController
public class NodeResource {


    @Autowired
    private NodeClient nodeClient;


    @GetMapping("/v1/nodes")
    public Flux<LinstorTypes.Node> getAll(@ModelAttribute ListOpts listOpts) {
        return nodeClient.getAll(listOpts);
    }

    @GetMapping("/v1/nodes/{nodeName}")
    public Mono<LinstorTypes.Node> get(@PathVariable("nodeName") String nodeName, @ModelAttribute ListOpts listOpts) {
        return nodeClient.get(nodeName, listOpts);
    }

    @PostMapping("/v1/nodes")
    public Mono<String> create(@RequestBody LinstorTypes.Node node) {
        return nodeClient.create(node);
    }

    @PutMapping("/v1/nodes/{nodeName}")
    public Mono<String> modify(@PathVariable("nodeName") String nodeName, @RequestBody LinstorTypes.NodeModify nodeModifyVo) {
        return nodeClient.modify(nodeName, nodeModifyVo);
    }

    @DeleteMapping("/v1/nodes/{nodeName}")
    public Mono<String> delete(@PathVariable("nodeName") String nodeName) {
        return nodeClient.delete(nodeName);
    }

    @DeleteMapping("/v1/nodes/{nodeName}/lost")
    public Mono<String> lost(@PathVariable("nodeName") String nodeName) {
        return nodeClient.lost(nodeName);
    }

    @PutMapping("/v1/nodes/{nodeName}/reconnect")
    public Mono<String> reconnect(@PathVariable("nodeName") String nodeName) {
        return nodeClient.reconnect(nodeName);
    }


    @PutMapping("/v1/nodes/{nodeName}/restore")
    public Mono<String> restore(@PathVariable("nodeName") String nodeName) {
        return nodeClient.restore(nodeName);
    }

    @GetMapping("/v1/nodes/{nodeName}/net-interfaces")
    public Flux<LinstorTypes.NetInterface> getNetInterfaces(@PathVariable("nodeName") String nodeName, @ModelAttribute ListOpts listOpts) {
        return nodeClient.getNetInterfaces(nodeName, listOpts);
    }

    @GetMapping("/v1/nodes/{nodeName}/net-interfaces/{nifName}")
    public Mono<LinstorTypes.NetInterface> getNetInterface(@PathVariable("nodeName") String nodeName, @PathVariable("nifName") String nifName, @ModelAttribute ListOpts listOpts) {
        return nodeClient.getNetInterface(nodeName, nifName, listOpts);
    }

    @PostMapping("/v1/nodes/{nodeName}/net-interfaces")
    public Mono<String> createNetInterface(@PathVariable("nodeName") String nodeName, @RequestBody LinstorTypes.NetInterface netInterface) {
        return nodeClient.createNetInterface(nodeName, netInterface);
    }

    @PutMapping("/v1/nodes/{nodeName}/net-interfaces/{nifName}")
    public Mono<String> modifyNetInterface(@PathVariable("nodeName") String nodeName, @PathVariable("nifName") String nifName, @RequestBody LinstorTypes.NetInterface netInterfaces) {
        return nodeClient.modifyNetInterface(nodeName, nifName, netInterfaces);
    }

    @DeleteMapping("/v1/nodes/{nodeName}/net-interfaces/{nifName}")
    public Mono<String> deleteNetinterface(@PathVariable("nodeName") String nodeName, @PathVariable("nifName") String nifName) {
        return nodeClient.deleteNetinterface(nodeName, nifName);
    }

    @GetMapping("/v1/view/storage-pools")
    public Flux<LinstorTypes.StoragePool> getStoragePoolView(@ModelAttribute ListOpts listOpts) {
        return nodeClient.getStoragePoolView(listOpts);
    }

    @GetMapping("/v1/nodes/{nodeName}/storage-pools")
    public Flux<LinstorTypes.StoragePool> getStoragePools(@PathVariable("nodeName") String nodeName, @ModelAttribute ListOpts listOpts) {
        return nodeClient.getStoragePools(nodeName, listOpts);
    }

    @GetMapping("/v1/nodes/{nodeName}/storage-pools/{spName}")
    public Mono<LinstorTypes.StoragePool> getStoragePool(@PathVariable("nodeName") String nodeName, @PathVariable("spName") String spName, @ModelAttribute ListOpts listOpts) {
        return nodeClient.getStoragePool(nodeName, spName, listOpts);
    }

    @PostMapping("/v1/nodes/{nodeName}/storage-pools")
    public Mono<String> createStoragePool(@PathVariable("nodeName") String nodeName, @RequestBody LinstorTypes.StoragePool storagePool) {
        return nodeClient.createStoragePool(nodeName, storagePool);
    }

    @PutMapping("/v1/nodes/{nodeName}/storage-pools/{spName}")
    public Mono<String> modifyStoragePool(@PathVariable("nodeName") String nodeName, @PathVariable("spName") String spName, @RequestBody LinstorTypes.StoragePoolDefinitionModify storagePoolDefinitionModify) {
        return nodeClient.modifyStoragePool(nodeName, spName, storagePoolDefinitionModify);
    }

    @DeleteMapping("/v1/nodes/{nodeName}/storage-pools/{spName}")
    public Mono<String> deleteStoragePool(@PathVariable("nodeName") String nodeName, @PathVariable("spName") String spName) {
        return nodeClient.deleteStoragePool(nodeName, spName);
    }

    @GetMapping("/metrics")
    public Mono<String> metrics() {
        return nodeClient.metrics();
    }


}
