package com.github.lihang941.minstor.service.biz.auth;

import com.alibaba.fastjson.JSON;
import com.github.lihang941.minstor.service.utils.GzipUtil;
import com.github.lihang941.tool.common.exception.ErrorMsgException;
import com.github.lihang941.tool.common.utils.RandomCode;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.IOUtils;
import org.springframework.stereotype.Component;

import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.*;

@Slf4j
@Component
public class DbManager {

    public static final String FILE_PATH = "data.db";

    private DbData dbData;

    public DbManager() {
        flushData();
    }

    public static final List<String> PERMISSIONS = Arrays.asList(
            "user", "iscsi", "nfs", "volume", "resource", "rd", "rg", "network", "storage-pool", "node", "log"
    );

    public void flushData() {
        try (FileReader fileReader = new FileReader(FILE_PATH);) {
            String s = IOUtils.toString(fileReader);
            String uncompress = GzipUtil.uncompress(s);
            this.dbData = JSON.parseObject(uncompress, DbData.class);
            if (this.dbData == null || this.dbData.getAuths() == null || this.dbData.getAuths().size() == 0) {
                this.initData();
            }
        } catch (Exception e) {
            log.warn("get fb file fail" + e.getMessage());
            this.initData();
        }
    }

    public void initData() {
        DbData dbData = new DbData();
        dbData.setAuths(new ArrayList<>());
        dbData.getAuths().add(new AuthVo()
                .setUserId(RandomCode.getUUIDString())
                .setName("admin")
                .setPassword("admin")
                .setEmail("minsotr")
                .setStatus(true)
                .setUpdateTime(new Date())
                .setPermissions(PERMISSIONS)
        );
        this.dbData = dbData;
        saveData();
    }

    public DbData getDbData() {
        return this.dbData;
    }


    public synchronized void saveData() {
        String data = GzipUtil.compress(JSON.toJSONString(this.dbData));
        try (FileWriter fileWriter = new FileWriter(FILE_PATH);) {
            IOUtils.write(data, fileWriter);
        } catch (IOException e) {
            log.info("Write failed");
            throw new ErrorMsgException("Write failed");
        }
    }


}
