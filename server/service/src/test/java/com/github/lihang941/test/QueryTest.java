package com.github.lihang941.test;

import java.util.ArrayList;

import com.github.lihang941.minstor.service.biz.linstor.vo.ListOpts;
import org.junit.Test;
import org.springframework.cglib.beans.BeanMap;

import java.util.Arrays;
import java.util.HashMap;

public class QueryTest {

    @Test
    public void query() {

        ListOpts listOpts = new ListOpts();
        listOpts.setOffset(0);
        listOpts.setLimit(0);
        listOpts.setStorage_pools(new ArrayList<String>(Arrays.asList("a", "b")));
        listOpts.setResources(new ArrayList<String>(Arrays.asList("a", "b")));
        listOpts.setNodes(new ArrayList<String>(Arrays.asList("a", "b")));
        listOpts.setProps(new ArrayList<String>(Arrays.asList("a", "b")));
        listOpts.setSnapshots(new ArrayList<String>(Arrays.asList("a", "b")));
        listOpts.setStatus(new ArrayList<String>(Arrays.asList("a", "b")));
//        BeanMap beanMap = BeanMap.create(listOpts);
//        for (Object key : beanMap.keySet()) {
//            map.put(key+"", beanMap.get(key));
//        }
//        System.out.println(JSON.toJSONString(copy));


        HashMap<String, String> objectObjectHashMap = new HashMap<>();
        objectObjectHashMap.put("aaa", "aaa");
        BeanMap beanMap = BeanMap.create(objectObjectHashMap);
        for (Object key : beanMap.keySet()) {
            System.out.println(key.toString() + "===" + beanMap.get(key));
        }


    }

}
