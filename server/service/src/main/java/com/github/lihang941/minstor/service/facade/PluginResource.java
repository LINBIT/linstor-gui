package com.github.lihang941.minstor.service.facade;

import com.github.lihang941.minstor.service.biz.target.TargetService;
import com.github.lihang941.minstor.service.biz.target.vo.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;


@RequestMapping("/v1/plugin")
@RestController
public class PluginResource {

    @Autowired
    private TargetService targetService;


    @PostMapping("/export/{nodeName}")
    public Mono<JsonRpcResultVo> exportCreate(@PathVariable String nodeName, @RequestBody ExportCreate exportCreate) {
        return targetService.exportCreate(nodeName, exportCreate);
    }

    @PostMapping("/nsf/{nodeName}")
    public Mono<JsonRpcResultVo> exportCreate(@PathVariable String nodeName, @RequestBody NfsCreate nfsCreate) {
        return targetService.nfsCreate(nodeName, nfsCreate);
    }

    @DeleteMapping("/export/{nodeName}")
    public Mono<JsonRpcResultVo> exportDestroy(@PathVariable String nodeName, @RequestBody ExportDestroy exportDestroy) {
        return targetService.exportDestroy(nodeName, exportDestroy);
    }

    @DeleteMapping("/nsf/{nodeName}")
    public Mono<JsonRpcResultVo> nfsRemove(@PathVariable String nodeName, @RequestBody NfsRemove nfsRemove) {
        return targetService.nfsRemove(nodeName, nfsRemove);
    }

    @GetMapping("/export")
    public Mono<List<TargetService.Volume>> exportList() {
        return targetService.genCatch();
    }


}
