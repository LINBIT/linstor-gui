package com.github.lihang941.minstor.service.biz.linstor.vo;

import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Accessors(chain = true)
@Data
public class ListOpts {
    private Integer offset;
    private Integer limit;
    private List<String> storage_pools;
    private List<String> resources;
    private List<String> nodes;
    private List<String> props;
    private List<String> snapshots;
    private List<String> status;
}
