package com.github.lihang941.minstor.service.biz.target;

import com.alibaba.fastjson.JSON;
import com.github.lihang941.minstor.service.biz.linstor.ResourceClient;
import com.github.lihang941.minstor.service.biz.linstor.vo.LinstorTypes;
import com.github.lihang941.minstor.service.biz.target.vo.*;
import com.github.lihang941.minstor.service.facade.NodeResource;
import com.github.lihang941.tool.common.exception.ErrorMsgException;
import lombok.Data;
import lombok.experimental.Accessors;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
public class TargetService {


    @Autowired
    private JsonRpcClient jsonRpcClient;


    @Autowired
    private ResourceClient resourceClient;
    @Autowired
    private NodeResource nodeResource;


    public Mono<List<Volume>> genCatch() {
        return Mono.zip(
                nodeResource.getAll(null)
                        .map(it -> {
                            Node node = new Node();
                            node.setNode(it);
                            node.setExportList(new ArrayList<>());
                            node.setNfsList(new ArrayList<>());
                            /*if (it.getNet_interfaces().size() > 0) {
                                return Mono.zip(
                                        jsonRpcClient.exportList(genBaseUrl(it)),
                                        jsonRpcClient.nfsList(genBaseUrl(it))
                                ).map(zip -> {
                                    node.setExportList(zip.getT1().getResult());
                                    node.setNfsList(zip.getT2().getResult());
                                    log.info("Acquired success{}", node.getNode().getName());
                                    return node;
                                }).onErrorResume(e -> {
                                    log.error("Get failed nodeName:{}  {} ", node.getNode().getName(), e.getMessage());
                                    return Mono.just(node);
                                });
                            } else {
                                log.info("no data {}", node.getNode().getName());
                                return Mono.just(node);
                            }*/
                            return Mono.just(node);
                        })
                        .flatMap(it -> it)
                        .collectMap(it -> {
                            return it.getNode().getName();
                        }, it -> it)
                ,
                resourceClient.getResourceView(null).collect(Collectors.toList())
        ).map(it -> {

            Set<String> paths = new HashSet<>();
            it.getT1().values().stream().forEach(node -> {

                node.getExportList().forEach(export -> {

                    try {
                        String s = export.getDevPath().split("/")[2];
                        paths.add(s);
                    } catch (Exception e) {

                    }

                });
                node.getNfsList().forEach(export -> {
                    try {
                        String s = export.getPath().split("/")[2];
                        paths.add(s);
                    } catch (Exception e) {

                    }

                });

            });

            return it.getT2().stream().flatMap(resource -> resource.getVolumes().stream().map(vol -> {
                        Volume volume = new Volume();
                        volume.setVolumes(resource);

                        volume.setVolume(vol);
                        volume.setNode(it.getT1().get(resource.getNode_name()));
                        volume.setNodeName(volume.getNode().getNode().getName());
                        String path = vol.getDevice_path().split("/")[2];
                        volume.setVolumeName(path);
                        volume.setInuse(
                                paths.contains(path)
                        );
                        return volume;
                    })
            ).collect(Collectors.toList());
        });
    }


    public String genBaseUrl(LinstorTypes.Node node) {
        return "http://" + node.getNet_interfaces().get(0).getAddress() + ":18700";
    }


    public Mono<JsonRpcResultVo> exportCreate(String nodeName, ExportCreate exportCreate) {
        return genCatch()
                .map(volumes -> {
                    Volume volume = volumes.stream().filter(it -> StringUtils.equals(nodeName, it.getNodeName()) && StringUtils.equals(it.getVolumeName(), exportCreate.getVol()))
                            .findFirst().orElse(null);
                    if (volume == null) {
                        throw new ErrorMsgException("Resource does not exist");
                    } else {
                        if (volume.isInuse()) {
                            throw new ErrorMsgException("Resource used");
                        }
                        return jsonRpcClient.exportCreate(genBaseUrl(volume.getNode().getNode()), exportCreate);
                    }
                }).flatMap(it -> it);
    }

    public Mono<JsonRpcResultVo> nfsCreate(String nodeName, NfsCreate nfsCreate) {
        return genCatch()
                .map(volumes -> {
                    Volume volume = volumes.stream().filter(it -> StringUtils.equals(nodeName, it.getNodeName())
                            && StringUtils.equals(it.getVolumeName(), nfsCreate.getDrive()))
                            .findFirst().orElse(null);
                    if (volume == null) {
                        throw new ErrorMsgException("Resource does not exist");
                    } else {
                        if (volume.isInuse()) {
                            throw new ErrorMsgException("Resource used");
                        }
                        return jsonRpcClient.nfsCreate(genBaseUrl(volume.getNode().getNode()), nfsCreate);
                    }
                }).flatMap(it -> it);
    }

    public Mono<JsonRpcResultVo> exportDestroy(String nodeName, ExportDestroy exportDestroy) {
        return genCatch()
                .map(volumes -> {
                    Volume volume = volumes.stream().filter(it -> StringUtils.equals(nodeName, it.getNodeName()) && StringUtils.equals(it.getVolumeName(), exportDestroy.getVol()))
                            .findFirst().orElse(null);
                    if (volume == null) {
                        throw new ErrorMsgException("Resource does not exist");
                    } else {
                        if (!volume.isInuse()) {
                            throw new ErrorMsgException("Resource unused");
                        }

                        ExportList.Export export = volume.getNode().getExportList().stream()
                                .filter(it ->
                                        StringUtils.equals(it.getStorageName(), exportDestroy.getVol()) && StringUtils.equals(it.getInitiatorWwn(), exportDestroy.getInitiatorWwn())
                                ).findFirst().orElse(null);
                        if (export == null) {
                            throw new ErrorMsgException("Resource does not exist");
                        }
                        return jsonRpcClient.exportDestroy(genBaseUrl(volume.getNode().getNode()), exportDestroy);
                    }
                }).flatMap(it -> it);
    }

    public Mono<JsonRpcResultVo> nfsRemove(String nodeName, NfsRemove nfsRemove) {
        return genCatch()
                .map(volumes -> {
                    Volume volume = volumes.stream().filter(it -> StringUtils.equals(nodeName, it.getNodeName()) && StringUtils.equals(it.getVolumeName(), nfsRemove.getDrive()))
                            .findFirst().orElse(null);
                    if (volume == null) {
                        throw new ErrorMsgException("Resource does not exist");
                    } else {
                        if (!volume.isInuse()) {
                            throw new ErrorMsgException("Resource unused");
                        }
                        NfsList.Nfs nfs = volume.getNode().getNfsList().stream()
                                .filter(it ->
                                        StringUtils.equals(it.getHost(), nfsRemove.getHost()) && StringUtils.equals(it.getPath(), "/nfs/" + nfsRemove.getDrive())
                                ).findFirst().orElse(null);
                        if (nfs == null) {
                            throw new ErrorMsgException("Resource does not exist");
                        }
                        return jsonRpcClient.nfsRemove(genBaseUrl(volume.getNode().getNode()), nfsRemove);
                    }
                }).flatMap(it -> it);
    }


    @Accessors(chain = true)
    @Data
    public static class Node {
        private LinstorTypes.Node node;
        private List<NfsList.Nfs> nfsList;
        private List<ExportList.Export> exportList;
    }

    @Accessors(chain = true)
    @Data
    public static class Volume {
        private LinstorTypes.ResourceWithVolumes volumes;
        private LinstorTypes.Volume volume; // 唯一
        private String nodeName;
        private String volumeName;
        private Node node;
        private boolean inuse;
    }

}
