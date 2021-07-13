package com.github.lihang941.minstor.service.facade;

import com.github.lihang941.minstor.service.biz.linstor.StoragePoolDefinitionClient;
import com.github.lihang941.minstor.service.biz.linstor.vo.LinstorTypes;
import com.github.lihang941.minstor.service.biz.linstor.vo.ListOpts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;


@RestController
public class StoragePoolDefinitionResource {

    @Autowired
    private StoragePoolDefinitionClient storagePoolDefinitionClient;


    @GetMapping("/v1/storage-pool-definitions")
    public Flux<LinstorTypes.StoragePoolDefinition> getAll(@ModelAttribute ListOpts listOpts) {
        return storagePoolDefinitionClient.getAll(listOpts);
    }

    @GetMapping("/v1/storage-pool-definitions/{spName}")
    public Mono<LinstorTypes.StoragePoolDefinition> get(@PathVariable String spdName, @ModelAttribute ListOpts listOpts) {
        return storagePoolDefinitionClient.get(spdName, listOpts);
    }

    @PostMapping("/v1/storage-pool-definitions")
    public Mono<String> create(@RequestBody LinstorTypes.StoragePoolDefinition storagePoolDefinition) {
        return storagePoolDefinitionClient.create(storagePoolDefinition);
    }

    @PutMapping("/v1/storage-pool-definitions/{spName}")
    public Mono<String> modify(@PathVariable String spdName, @RequestBody LinstorTypes.StoragePoolDefinitionModify storagePoolDefinitionModify) {
        return storagePoolDefinitionClient.modify(spdName, storagePoolDefinitionModify);
    }

    @DeleteMapping("/v1/storage-pool-definitions/{spName}")
    public Mono<String> delete(@PathVariable String spdName) {
        return storagePoolDefinitionClient.delete(spdName);
    }


}
