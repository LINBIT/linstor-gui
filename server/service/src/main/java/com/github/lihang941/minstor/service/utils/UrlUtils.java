package com.github.lihang941.minstor.service.utils;

import org.springframework.cglib.beans.BeanMap;
import org.springframework.web.util.UriBuilder;

import java.util.Collection;
import java.util.Map;
import java.util.function.BiConsumer;

public class UrlUtils {


    public static UriBuilder buildQueryParam(UriBuilder uriBuilder, String path, Object... queryParam) {
        uriBuilder.path(path);
        for (Object o : queryParam) {
            if (o != null) {
                if (Map.class.isAssignableFrom(o.getClass())) {
                    ((Map) o).forEach(getBiConsumer(uriBuilder));
                } else {
                    BeanMap.create(o).forEach(getBiConsumer(uriBuilder));
                }
            }
        }
        return uriBuilder;
    }

    private static BiConsumer getBiConsumer(UriBuilder uriBuilder) {
        return (k, v) -> {
            if (v != null && k != null) {
                String name = k.toString();
                if (Collection.class.isAssignableFrom(v.getClass())) {
                    uriBuilder.queryParam(name, (Collection<?>) v);
                } else {
                    String value = v.toString();
                    uriBuilder.queryParam(name, value);
                }
            }
        };
    }


}
