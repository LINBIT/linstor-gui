package com.github.lihang941.minstor.service.config;

import com.alibaba.fastjson.JSON;
import lombok.Data;
import lombok.experimental.Accessors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

@Component
@Accessors(chain = true)
@Data
@Slf4j
public class WebStaticProperties {

    @Value("${web.pattern}")
    private String pattern;
    @Value("${web.path}")
    private String path;


    @PostConstruct
    private void onCreate() {
        log.info("web config:{}", JSON.toJSONString(this));
    }


}
