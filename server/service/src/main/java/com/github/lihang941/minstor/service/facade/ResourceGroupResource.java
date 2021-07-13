package com.github.lihang941.minstor.service.facade;

import com.github.lihang941.minstor.service.biz.linstor.ResourceGroupClient;
import com.github.lihang941.minstor.service.biz.linstor.vo.LinstorTypes;
import com.github.lihang941.minstor.service.biz.linstor.vo.ListOpts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
public class ResourceGroupResource {

    @Autowired
    private ResourceGroupClient resourceGroupClient;


    @GetMapping("/v1/resource-groups")
    public Flux<LinstorTypes.ResourceGroup> getAll(@ModelAttribute ListOpts listOpts) {
        return resourceGroupClient.getAll(listOpts);
    }

    @GetMapping("/v1/resource-groups/{resGrpName}")
    public Mono<LinstorTypes.ResourceGroup> get(@PathVariable String resGrpName, @ModelAttribute ListOpts listOpts) {
        return resourceGroupClient.get(resGrpName, listOpts);
    }

    @PostMapping("/v1/resource-groups")
    public Mono<String> create(@RequestBody LinstorTypes.ResourceGroup resourceGroup) {
        return resourceGroupClient.create(resourceGroup);
    }

    @PutMapping("/v1/resource-groups/{resGrpName}")
    public Mono<String> modify(@PathVariable String resGrpName, @RequestBody LinstorTypes.ResourceGroupModify resourceGroupModify) {
        return resourceGroupClient.modify(resGrpName, resourceGroupModify);
    }

    @DeleteMapping("/v1/resource-groups/{resGrpName}")
    public Mono<String> delete(@PathVariable String resGrpName) {
        return resourceGroupClient.delete(resGrpName);
    }

    @PostMapping("/v1/resource-groups/{resGrpName}/spawn")
    public Mono<String> spawn(@PathVariable String resGrpName, @RequestBody LinstorTypes.ResourceGroupSpawn resourceGroupSpawn) {
        return resourceGroupClient.spawn(resGrpName, resourceGroupSpawn);
    }

    @GetMapping("/v1/resource-groups/{resGrpName}/volume-groups")
    public Flux<LinstorTypes.VolumeGroup> getVolumeGroups(@PathVariable String resGrpName, @ModelAttribute ListOpts listOpts) {
        return resourceGroupClient.getVolumeGroups(resGrpName, listOpts);
    }

    @GetMapping("/v1/resource-groups/{resGrpName}/volume-groups/{volNr}")
    public Mono<LinstorTypes.VolumeGroup> getVolumeGroup(@PathVariable String resGrpName, @PathVariable Integer volNr, @ModelAttribute ListOpts listOpts) {
        return resourceGroupClient.getVolumeGroup(resGrpName, volNr, listOpts);
    }

    @PostMapping("/v1/resource-groups/{resGrpName}/volume-groups")
    public Mono<String> createVolumeGroup(@PathVariable String resGrpName, @RequestBody LinstorTypes.VolumeGroup volGrp) {
        return resourceGroupClient.createVolumeGroup(resGrpName, volGrp);
    }

    @PutMapping("/v1/resource-groups/{resGrpName}/volume-groups/{volNr}")
    public Mono<String> modifyVolumeGroup(@PathVariable String resGrpName, @PathVariable Integer volNr, @RequestBody LinstorTypes.VolumeGroupModify props) {
        return resourceGroupClient.modifyVolumeGroup(resGrpName, volNr, props);
    }

    @DeleteMapping("/v1/resource-groups/{resGrpName}/volume-groups/{volNr}")
    public Mono<String> deleteVolumeGroup(@PathVariable String resGrpName, @PathVariable Integer volNr) {
        return resourceGroupClient.deleteVolumeGroup(resGrpName, volNr);
    }

}
