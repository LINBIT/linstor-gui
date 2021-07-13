package com.github.lihang941.minstor.service.facade;

import com.github.lihang941.minstor.service.biz.linstor.ControllerClient;
import com.github.lihang941.minstor.service.biz.linstor.vo.LinstorTypes;
import com.github.lihang941.minstor.service.biz.linstor.vo.ListOpts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.Map;

@RestController
public class ControllerApi {

    @Autowired
    private ControllerClient controllerClient;


    @GetMapping("/v1/controller/version")
    public Mono<LinstorTypes.ControllerVersion> getVersion(@ModelAttribute ListOpts listOpts) {
        return controllerClient.getVersion(listOpts);
    }

    @GetMapping("/v1/controller/config")
    public Mono<LinstorTypes.ControllerConfig> getConfig(@ModelAttribute ListOpts listOpts) {
        return controllerClient.getConfig(listOpts);
    }

    @PutMapping("/v1/controller/config")
    public Mono<String> modifyConfig(@RequestBody LinstorTypes.ControllerConfig  controllerConfig) {
        return controllerClient.modifyConfig(controllerConfig);
    }

    @PostMapping("/v1/controller/properties")
    public Mono<String> modify(@RequestBody LinstorTypes.ControllerPropsModify controllerPropsModify) {
        return controllerClient.modify(controllerPropsModify);
    }

    @GetMapping("/v1/controller/properties")
    public Mono<Map<String, String>> getProps(@ModelAttribute ListOpts listOpts) {
        return controllerClient.getProps(listOpts);
    }


    @DeleteMapping("/v1/controller/properties/{prop}")
    public Mono<String> deleteProp(String prop) {
        return controllerClient.deleteProp(prop);
    }

//    @GetMapping("/v1/error-reports")
//    public Flux<LinstorTypes.ErrorReport> getErrorReports(@ModelAttribute ListOpts listOpts) {
//        return controllerClient.getErrorReports(listOpts);
//    }

    @DeleteMapping("/v1/error-reports")
    public Mono<String> deleteErrorReports(@RequestParam("id") String id) {
        return controllerClient.deleteErrorReports(new LinstorTypes.ErrorReportDelete().setIds(Arrays.asList(id)));
    }

    @GetMapping("/v1/error-reports")
    public Flux<LinstorTypes.ErrorReport> getErrorReportsSince(@RequestParam(required = false) Long since, @ModelAttribute ListOpts listOpts) {
        return controllerClient.getErrorReportsSince(since, listOpts);
    }

    @GetMapping("/v1/error-reports/{id}")
    public Flux<LinstorTypes.ErrorReport> getErrorReport(@PathVariable String id, @ModelAttribute ListOpts listOpts) {
        return controllerClient.getErrorReport(id, listOpts);
    }


    @GetMapping("/v1/sos-report")
    public Mono<String> createSOSReport(@ModelAttribute ListOpts listOpts) {
        return controllerClient.createSOSReport(listOpts);
    }

    @GetMapping("/v1/sos-report/download")
    public Mono<String> downloadSOSReport(@ModelAttribute ListOpts listOpts) {
        return controllerClient.downloadSOSReport(listOpts);
    }

    @GetMapping("/v1/nodes/{node}/config")
    public Mono<LinstorTypes.SatelliteConfig> getSatelliteConfig(@PathVariable String node) {
        return controllerClient.getSatelliteConfig(node);
    }

    @PutMapping("/v1/nodes/{node}/config")
    public Mono<String> modifySatelliteConfig(@PathVariable String node, @RequestBody LinstorTypes.SatelliteConfig satelliteConfig) {
        return controllerClient.modifySatelliteConfig(node, satelliteConfig);
    }

}
