package com.github.lihang941.minstor.service.facade;

import com.github.lihang941.minstor.service.biz.linstor.ResourceClient;
import com.github.lihang941.minstor.service.biz.linstor.vo.LinstorTypes;
import com.github.lihang941.minstor.service.biz.linstor.vo.ListOpts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
public class ResourceApi {

    @Autowired
    private ResourceClient resourceClient;

    @GetMapping("/v1/view/resources")
    public Flux<LinstorTypes.ResourceWithVolumes> getResourceView(@ModelAttribute ListOpts listOpts) {
        return resourceClient.getResourceView(listOpts);
    }

    @GetMapping("/v1/resource-definitions/{resName}/resources")
    public Flux<LinstorTypes.Resource> getAll(@PathVariable String resName, @ModelAttribute ListOpts listOpts) {
        return resourceClient.getAll(resName, listOpts);
    }

    @GetMapping("/v1/resource-definitions/{resName}/resources/{nodeName}")
    public Mono<LinstorTypes.Resource> get(@PathVariable String resName, @PathVariable String nodeName, @ModelAttribute ListOpts listOpts) {
        return resourceClient.get(resName, nodeName, listOpts);
    }

    @PostMapping("/v1/resource-definitions/{resName}/resources/{nodeName}")
    public Mono<String> create(@PathVariable String resName, @PathVariable String nodeName, @RequestBody LinstorTypes.ResourceCreate resourceCreate) {
        resourceCreate.resource.name = resName;
        resourceCreate.resource.node_name = nodeName;
        return resourceClient.create(resourceCreate);
    }

    @PutMapping("/v1/resource-definitions/{resName}/resources/{nodeName}")
    public Mono<String> modify(@PathVariable String resName, @PathVariable String nodeName, @RequestBody LinstorTypes.ResourceModify resourceModify) {
        return resourceClient.modify(resName, nodeName, resourceModify);
    }

    @DeleteMapping("/v1/resource-definitions/{resName}/resources/{nodeName}")
    public Mono<String> delete(@PathVariable String resName, @PathVariable String nodeName) {
        return resourceClient.delete(resName, nodeName);
    }

    @GetMapping("/v1/resource-definitions/{resName}/resources/{nodeName}/volumes")
    public Flux<LinstorTypes.Volume> getVolumes(@PathVariable String resName, @PathVariable String nodeName, @ModelAttribute ListOpts listOpts) {
        return resourceClient.getVolumes(resName, nodeName, listOpts);
    }

    @GetMapping("/v1/resource-definitions/{resName}/resources/{nodeName}/volumes/{volNr}")
    public Mono<LinstorTypes.Volume> getVolume(@PathVariable String resName, @PathVariable String nodeName, @PathVariable Integer volNr, @ModelAttribute ListOpts listOpts) {
        return resourceClient.getVolume(resName, nodeName, volNr, listOpts);
    }

    @PutMapping("/v1/resource-definitions/{resName}/resources/{nodeName}/volumes/{volNr}")
    public Mono<String> modifyVolume(@PathVariable String resName, @PathVariable String nodeName, @PathVariable Integer volNr, @RequestBody LinstorTypes.VolumeModify volumeModify) {
        return resourceClient.modifyVolume(resName, nodeName, volNr, volumeModify);
    }

    @PutMapping("/v1/resource-definitions/{resName}/resources/{nodeName}/toggle-disk/diskless/{disklessPoolName}")
    public Mono<String> diskless(@PathVariable String resName, @PathVariable String nodeName, @PathVariable String disklessPoolName) {
        return resourceClient.diskless(resName, nodeName, disklessPoolName);
    }

    @PutMapping("/v1/resource-definitions/{resName}/resources/{nodeName}/toggle-disk/diskless")
    public Mono<String> diskless(@PathVariable String resName, @PathVariable String nodeName) {
        return resourceClient.diskless(resName, nodeName, null);
    }

    @PutMapping("/v1/resource-definitions/{resName}/resources/{nodeName}/toggle-disk/diskful/{storagePoolName}")
    public Mono<String> diskFul(@PathVariable String resName, @PathVariable String nodeName, @PathVariable String storagePoolName) {
        return resourceClient.diskful(resName, nodeName, storagePoolName);
    }

    @PutMapping("/v1/resource-definitions/{resName}/resources/{nodeName}/toggle-disk/diskful")
    public Mono<String> diskFul(@PathVariable String resName, @PathVariable String nodeName) {
        return resourceClient.diskful(resName, nodeName, null);
    }


    @PutMapping("/v1/resource-definitions/{resName}/resources/{toNodeName}/migrate-disk/{fromNodeName}")
    public Mono<String> migrate(@PathVariable String resName, @PathVariable String fromNodeName, @PathVariable String toNodeName) {
        return resourceClient.migrate(resName, fromNodeName, toNodeName, null);
    }

    @PutMapping("/v1/resource-definitions/{resName}/resources/{toNodeName}/migrate-disk/{fromNodeName}/{storagePoolName}")
    public Mono<String> migrate(@PathVariable String resName, @PathVariable String fromNodeName, @PathVariable String toNodeName, @PathVariable String storagePoolName) {
        return resourceClient.migrate(resName, fromNodeName, toNodeName, storagePoolName);
    }

    @PostMapping("/v1/resource-definitions/{resName}/autoplace")
    public Mono<String> autoplace(@PathVariable String resName, @RequestBody LinstorTypes.AutoPlaceRequest autoPlaceRequest) {
        return resourceClient.autoplace(resName, autoPlaceRequest);
    }

    @GetMapping("/v1/resource-definitions/{resName}/resources-connections")
    public Flux<LinstorTypes.ResourceConnection> getConnections(@PathVariable String resName, @ModelAttribute ListOpts listOpts) {
        return resourceClient.getConnections(resName, null, null, listOpts);
    }

    @GetMapping("/v1/resource-definitions/{resName}/resources-connections/{nodeAName}/{nodeBName}")
    public Flux<LinstorTypes.ResourceConnection> getConnections(@PathVariable String resName, @PathVariable String nodeAName, @PathVariable String nodeBName, @ModelAttribute ListOpts listOpts) {
        return resourceClient.getConnections(resName, nodeAName, nodeBName, listOpts);
    }


    @PutMapping("/v1/resource-definitions/{resName}/resources-connections/{nodeAName}/{nodeBName}")
    public Mono<String> modifyConnection(@PathVariable String resName, @PathVariable String nodeAName, @PathVariable String nodeBName, @RequestBody LinstorTypes.ResourceConnectionModify props) {
        return resourceClient.modifyConnection(resName, nodeAName, nodeBName, props);
    }

    @GetMapping("/v1/resource-definitions/{resName}/snapshots")
    public Flux<LinstorTypes.Snapshot> getSnapshots(@PathVariable String resName, @ModelAttribute ListOpts listOpts) {
        return resourceClient.getSnapshots(resName, listOpts);
    }

    @GetMapping("/v1/view/snapshots")
    public Flux<LinstorTypes.Snapshot> getSnapshotView(@ModelAttribute ListOpts listOpts) {
        return resourceClient.getSnapshotView(listOpts);
    }

    @GetMapping("/v1/resource-definitions/{resName}/snapshots/{snapName}")
    public Flux<LinstorTypes.Snapshot> getSnapshotView(@PathVariable String resName, @PathVariable String snapName, @ModelAttribute ListOpts listOpts) {
        return resourceClient.getSnapshotView(resName, snapName, listOpts);
    }

    @PostMapping("/v1/resource-definitions/{resName}/snapshots")
    public Mono<String> createSnapshot(@PathVariable String resName, @RequestBody LinstorTypes.Snapshot snapshot) {
        snapshot.resource_name = resName;
        return resourceClient.createSnapshot(snapshot);
    }

    @DeleteMapping("/v1/resource-definitions/{resName}/snapshots/{snapName}")
    public Mono<String> deleteSnapshot(@PathVariable String resName, @PathVariable String snapName) {
        return resourceClient.deleteSnapshot(resName, snapName);
    }


    @PostMapping("/v1/resource-definitions/{origResName}/snapshot-restore-resource/{snapName}")
    public Mono<String> restoreSnapshot(@PathVariable String origResName, @PathVariable String snapName, @RequestBody LinstorTypes.SnapshotRestore snapshotRestore) {
        return resourceClient.restoreSnapshot(origResName, snapName, snapshotRestore);
    }

    @PostMapping("/v1/resource-definitions/{origResName}/snapshot-restore-volume-definition/{snapName}")
    public Mono<String> restoreVolumeDefinitionSnapshot(@PathVariable String origResName, @PathVariable String snapName, @RequestBody LinstorTypes.SnapshotRestore snapshotRestore) {
        return resourceClient.restoreVolumeDefinitionSnapshot(origResName, snapName, snapshotRestore);
    }

    @PostMapping("/v1/resource-definitions/{resName}/snapshot-rollback/{snapName}")
    public Mono<String> rollbackSnapshot(@PathVariable String resName, @PathVariable String snapName) {
        return resourceClient.rollbackSnapshot(resName, snapName);
    }

    @PostMapping("/v1/resource-definitions/{resName}/snapshot-shipping")
    public Mono<String> enableSnapshotShipping(@PathVariable String resName, @PathVariable String snapName, @RequestBody LinstorTypes.SnapshotShipping snapshotShipping) {
        return resourceClient.enableSnapshotShipping(resName, snapName, snapshotShipping);
    }

    @PostMapping("/v1/resource-definitions/{resName}/drbd-proxy")
    public Mono<String> modifyDRBDProxy(@PathVariable String resName, @RequestBody LinstorTypes.DrbdProxyModify drbdProxyModify) {
        return resourceClient.modifyDRBDProxy(resName, drbdProxyModify);
    }

    @PostMapping("/v1/resource-definitions/{resName}/drbd-proxy/{what}/{nodeAName}/{nodeBName}")
    public Mono<String> enableDisableDRBDProxy(@PathVariable String what, @PathVariable String resName, @PathVariable String nodeAName, @PathVariable String nodeBName) {
        return resourceClient.enableDisableDRBDProxy(what, resName, nodeAName, nodeBName);
    }


    @RequestMapping(value = "/v1/query-max-volume-size", method = RequestMethod.OPTIONS)
    public Mono<LinstorTypes.MaxVolumeSizes> queryMaxVolumeSize(@ModelAttribute LinstorTypes.AutoSelectFilter autoSelectFilter) {
        return resourceClient.queryMaxVolumeSize(autoSelectFilter);
    }

    @GetMapping("/v1/view/snapshot-shippings")
    public Flux<LinstorTypes.SnapshotShippingStatus> getSnapshotShippings(@ModelAttribute ListOpts listOpts) {
        return resourceClient.getSnapshotShippings(listOpts);
    }

}
