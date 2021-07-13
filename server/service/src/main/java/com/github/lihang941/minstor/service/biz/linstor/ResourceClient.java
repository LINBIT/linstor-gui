package com.github.lihang941.minstor.service.biz.linstor;

import com.github.lihang941.minstor.service.biz.linstor.vo.LinstorTypes;
import com.github.lihang941.minstor.service.biz.linstor.vo.ListOpts;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import static com.github.lihang941.minstor.service.utils.UrlUtils.buildQueryParam;

@Component
public class ResourceClient {

    @Autowired
    private WebClient webClient;


    public Flux<LinstorTypes.ResourceWithVolumes> getResourceView(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder -> buildQueryParam(uriBuilder, "/v1/view/resources", listOpts).build())
                .retrieve()
                .bodyToFlux(LinstorTypes.ResourceWithVolumes.class);
    }

    public Flux<LinstorTypes.Resource> getAll(String resName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/resources", listOpts)
                                .build(resName)
                )
                .retrieve()
                .bodyToFlux(LinstorTypes.Resource.class);
    }

    public Mono<LinstorTypes.Resource> get(String resName, String nodeName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/resources/{nodeName}", listOpts)
                                .build(resName, nodeName)
                )
                .retrieve()
                .bodyToMono(LinstorTypes.Resource.class);
    }


    public Mono<String> create(LinstorTypes.ResourceCreate resourceCreate) {
        return webClient.post()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/resources/{nodeName}")
                                .build(resourceCreate.resource.name, resourceCreate.resource.node_name)
                )
                .bodyValue(resourceCreate)
                .retrieve()
                .bodyToMono(String.class);
    }


    public Mono<String> modify(String resName, String nodeName, LinstorTypes.ResourceModify resourceModify) {
        return webClient.put()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/resources/{nodeName}")
                                .build(resName, nodeName)
                )
                .bodyValue(resourceModify)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> delete(String resName, String nodeName) {
        return webClient.delete()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/resources/{nodeName}")
                                .build(resName, nodeName)
                )
                .retrieve()
                .bodyToMono(String.class);
    }

    public Flux<LinstorTypes.Volume> getVolumes(String resName, String nodeName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/resources/{nodeName}/volumes", listOpts)
                                .build(resName, nodeName)
                )
                .retrieve()
                .bodyToFlux(LinstorTypes.Volume.class);
    }

    public Mono<LinstorTypes.Volume> getVolume(String resName, String nodeName, Integer volNr, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/resources/{nodeName}/volumes/{volNr}", listOpts)
                                .build(resName, nodeName, volNr)
                )
                .retrieve()
                .bodyToMono(LinstorTypes.Volume.class);
    }

    public Mono<String> modifyVolume(String resName, String nodeName, Integer volNr, LinstorTypes.VolumeModify volumeModify) {
        return webClient.put()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/resources/{nodeName}/volumes/{volNr}")
                                .build(resName, nodeName, volNr)
                )
                .bodyValue(volumeModify)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> diskless(String resName, String nodeName, String disklessPoolName) {
        return webClient.put()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/resources/{nodeName}/toggle-disk/diskless{disklessPoolName}")
                                .build(resName, nodeName, StringUtils.isBlank(disklessPoolName) ? "" : ("/" + disklessPoolName))
                )
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> diskful(String resName, String nodeName, String storagePoolName) {
        return webClient.put()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/resources/{nodeName}/toggle-disk/diskful{storagePoolName}")
                                .build(resName, nodeName, StringUtils.isBlank(storagePoolName) ? "" : ("/" + storagePoolName))
                )
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> migrate(String resName, String fromNode, String toNodeName, String storagePoolName) {
        return webClient.put()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/resources/{toNodeName}/migrate-disk/{fromNodeName}{storagePoolName}")
                                .build(resName, toNodeName, fromNode, StringUtils.isBlank(storagePoolName) ? "" : ("/" + storagePoolName))
                )
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> autoplace(String resName, LinstorTypes.AutoPlaceRequest autoPlaceRequest) {
        return webClient.post()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/autoplace")
                                .build(resName)

                )
                .bodyValue(autoPlaceRequest)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Flux<LinstorTypes.ResourceConnection> getConnections(String resName, String nodeAName, String nodeBName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/resources-connections{nodeAll}", listOpts)
                                .build(resName
                                        , StringUtils.isNoneBlank(nodeAName, nodeBName) ? ("/" + nodeAName + "/" + nodeBName) : "")

                )
                .retrieve()
                .bodyToFlux(LinstorTypes.ResourceConnection.class);
    }

    public Mono<String> modifyConnection(String resName, String nodeAName, String nodeBName, LinstorTypes.ResourceConnectionModify props) {
        return webClient.put()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/resources-connections/{nodeA}/{nodeB}")
                                .build(resName, nodeAName, nodeBName)

                )
                .bodyValue(props)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Flux<LinstorTypes.Snapshot> getSnapshots(String resName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/snapshots", listOpts)
                                .build(resName)

                )
                .retrieve()
                .bodyToFlux(LinstorTypes.Snapshot.class);
    }

    public Flux<LinstorTypes.Snapshot> getSnapshotView(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/view/snapshots", listOpts)
                                .build()

                )
                .retrieve()
                .bodyToFlux(LinstorTypes.Snapshot.class);
    }

    public Flux<LinstorTypes.Snapshot> getSnapshotView(String resName, String snapName, ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/snapshots/{snapName}", listOpts)
                                .build()

                )
                .retrieve()
                .bodyToFlux(LinstorTypes.Snapshot.class);
    }

    public Mono<String> createSnapshot(LinstorTypes.Snapshot snapshot) {
        return webClient.post()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/snapshots")
                                .build(snapshot.resource_name)

                )
                .bodyValue(snapshot)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> deleteSnapshot(String resName, String snapName) {
        return webClient.delete()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/snapshots/{snapName}")
                                .build(resName, snapName)

                )
                .retrieve()
                .bodyToMono(String.class);
    }


    public Mono<String> restoreSnapshot(String origResName, String snapName, LinstorTypes.SnapshotRestore snapshotRestore) {
        return webClient.post()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/snapshot-restore-resource/{snapName}")
                                .build(origResName, snapName)

                )
                .bodyValue(snapshotRestore)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> restoreVolumeDefinitionSnapshot(String origResName, String snapName, LinstorTypes.SnapshotRestore snapshotRestore) {
        return webClient.post()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/snapshot-restore-volume-definition/{snapName}")
                                .build(origResName, snapName)

                )
                .bodyValue(snapshotRestore)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> rollbackSnapshot(String resName, String snapName) {
        return webClient.post()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/snapshot-rollback/{snapName}")
                                .build(resName, snapName)

                )
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> enableSnapshotShipping(String resName, String snapName, LinstorTypes.SnapshotShipping snapshotShipping) {
        return webClient.post()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/snapshot-shipping")
                                .build(resName, snapName)

                )
                .bodyValue(snapshotShipping)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> modifyDRBDProxy(String resName, LinstorTypes.DrbdProxyModify drbdProxyModify) {
        return webClient.post()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/drbd-proxy")
                                .build(resName)

                )
                .bodyValue(drbdProxyModify)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> enableDisableDRBDProxy(String what, String resName, String nodeAName, String nodeBName) {
        return webClient.post()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/resource-definitions/{resName}/drbd-proxy/{what}/{nodeAName}/{nodeBName}")
                                .build(resName, what, nodeAName, nodeBName)

                )
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> enableDRBDProxy(String resName, String nodeAName, String nodeBName) {
        return enableDisableDRBDProxy("enable", resName, nodeAName, nodeBName);
    }

    public Mono<String> disableDRBDProxy(String resName, String nodeAName, String nodeBName) {
        return enableDisableDRBDProxy("disable", resName, nodeAName, nodeBName);
    }

    public Mono<LinstorTypes.MaxVolumeSizes> queryMaxVolumeSize(LinstorTypes.AutoSelectFilter autoSelectFilter) {
        return webClient.options()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/query-max-volume-size", autoSelectFilter)
                                .build()

                )
                .retrieve()
                .bodyToMono(LinstorTypes.MaxVolumeSizes.class);
    }

    public Flux<LinstorTypes.SnapshotShippingStatus> getSnapshotShippings(ListOpts listOpts) {
        return webClient.get()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder, "/v1/view/snapshot-shippings", listOpts)
                                .build()

                )
                .retrieve()
                .bodyToFlux(LinstorTypes.SnapshotShippingStatus.class);
    }

}
