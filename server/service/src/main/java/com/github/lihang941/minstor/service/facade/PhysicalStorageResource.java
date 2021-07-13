package com.github.lihang941.minstor.service.facade;

import com.github.lihang941.minstor.service.biz.linstor.PhysicalStorageClient;
import com.github.lihang941.minstor.service.biz.linstor.vo.LinstorTypes;
import com.github.lihang941.minstor.service.biz.linstor.vo.ListOpts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

//@RestController
public class PhysicalStorageResource {

    @Autowired
    private PhysicalStorageClient physicalStorageClient;

    @GetMapping("/v1/physical-storage/")
    public Flux<LinstorTypes.PhysicalStorage> getPhysicalStorage(@ModelAttribute ListOpts listOpts) {
        return physicalStorageClient.getPhysicalStorage(listOpts);
    }

    @PostMapping("/v1/physical-storage/{nodeName}")
    public Mono<String> createDevicePool(@PathVariable String nodeName, @RequestBody LinstorTypes.PhysicalStorageCreate physicalStorageCreate) {
        return physicalStorageClient.createDevicePool(nodeName, physicalStorageCreate);
    }

}
