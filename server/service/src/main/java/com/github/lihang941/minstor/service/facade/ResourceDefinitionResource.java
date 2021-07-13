package com.github.lihang941.minstor.service.facade;

import com.github.lihang941.minstor.service.biz.linstor.ResourceDefinitionClient;
import com.github.lihang941.minstor.service.biz.linstor.vo.LinstorTypes;
import com.github.lihang941.minstor.service.biz.linstor.vo.ListOpts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
public class ResourceDefinitionResource {

    @Autowired
    private ResourceDefinitionClient resourceDefinitionClient;


    @GetMapping("/v1/resource-definitions")
    public Flux<LinstorTypes.ResourceDefinition> getAll(@ModelAttribute ListOpts listOpts) {
        return resourceDefinitionClient.getAll(listOpts);
    }

    @GetMapping("/v1/resource-definitions/{resDefName}")
    public Mono<LinstorTypes.ResourceDefinition> get(@PathVariable String resDefName, @ModelAttribute ListOpts listOpts) {
        return resourceDefinitionClient.get(resDefName, listOpts);
    }

    @PostMapping("/v1/resource-definitions")
    public Mono<String> create(@RequestBody LinstorTypes.ResourceDefinitionCreate resourceDefinitionCreate) {
        return resourceDefinitionClient.create(resourceDefinitionCreate);
    }

    @PostMapping("/v1/resource-definitions/{resDefName}")
    public Mono<String> modify(@PathVariable String resDefName, @RequestBody LinstorTypes.ResourceDefinitionModify resourceDefinitionModify) {
        return resourceDefinitionClient.modify(resDefName, resourceDefinitionModify);
    }

    @DeleteMapping("/v1/resource-definitions/{resDefName}")
    public Mono<String> delete(@PathVariable String resDefName) {
        return resourceDefinitionClient.delete(resDefName);
    }

    @GetMapping("/v1/resource-definitions/{resDefName}/volume-definitions")
    public Flux<LinstorTypes.VolumeDefinition> getVolumeDefinitions(@PathVariable String resDefName) {
        return resourceDefinitionClient.getVolumeDefinitions(resDefName);
    }

    @GetMapping("/v1/resource-definitions/{resDefName}/volume-definitions/{volNr}")
    public Mono<LinstorTypes.VolumeDefinition> getVolumeDefinition(@PathVariable String resDefName, @PathVariable Integer volNr) {
        return resourceDefinitionClient.getVolumeDefinition(resDefName, volNr);
    }

    @PostMapping("/v1/resource-definitions/{resDefName}/volume-definitions")
    public Mono<String> createVolumeDefinition(@PathVariable String resDefName, @RequestBody LinstorTypes.VolumeDefinitionCreate volDef) {
        return resourceDefinitionClient.createVolumeDefinition(resDefName, volDef);
    }

    @PutMapping("/v1/resource-definitions/{resDefName}/volume-definitions/{volNr}")
    public Mono<String> modifyVolumeDefinition(@PathVariable String resDefName, @PathVariable Integer volNr, @RequestBody LinstorTypes.VolumeDefinitionModify props) {
        return resourceDefinitionClient.modifyVolumeDefinition(resDefName, volNr, props);
    }

    @DeleteMapping("/v1/resource-definitions/{resDefName}/volume-definitions/{volNr}")
    public Mono<String> deleteVolumeDefinition(@PathVariable String resDefName, @PathVariable Integer volNr) {
        return resourceDefinitionClient.deleteVolumeDefinition(resDefName, volNr);
    }


    @PostMapping("/v1/resource-definitions/{resDefName}/resources/{nodeName}/activate")
    public Mono<String> activate(@PathVariable String resDefName, @PathVariable String nodeName) {
        return resourceDefinitionClient.activate(resDefName, nodeName);
    }

    @PostMapping("/v1/resource-definitions/{resDefName}/resources/{nodeName}/deactivate")
    public Mono<String> deactivate(@PathVariable String resDefName, @PathVariable String nodeName) {
        return resourceDefinitionClient.deactivate(resDefName, nodeName);
    }


}
