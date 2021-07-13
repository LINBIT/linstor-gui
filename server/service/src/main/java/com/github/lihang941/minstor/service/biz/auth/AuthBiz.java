package com.github.lihang941.minstor.service.biz.auth;

import com.github.lihang941.tool.common.bean.BeanConvert;
import com.github.lihang941.tool.common.exception.ErrorMsgException;
import com.github.lihang941.tool.common.utils.RandomCode;
import com.github.lihang941.tool.common.utils.TimeUtils;
import lombok.Data;
import lombok.experimental.Accessors;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Slf4j
@Component
public class AuthBiz {

    @Autowired
    private DbManager dbManager;


    @Accessors(chain = true)
    @Data
    public static class Session {
        private String token;
        private Date createTime;
        private AuthVo authVo;
    }

    private Map<String, Session> sessionMap = new ConcurrentHashMap<>();


    public Session addSession(AuthVo authVo) {
        String uuidString = RandomCode.getUUIDString();
        Session session = new Session().setToken(uuidString).setAuthVo(authVo).setCreateTime(new Date());
        sessionMap.put(uuidString, session);
        return session;
    }

    public void removeSession(String token) {
        sessionMap.remove(token);
    }

    public Session getSession(String token) {
        return sessionMap.get(token);
    }

    @Scheduled(cron = "0 0/1 * * * ? ")
    public void checkSession() {
        sessionMap.values().forEach(it -> {
            if (it.getCreateTime().compareTo(new Date(System.currentTimeMillis() - TimeUtils.timeByDay(7))) < 0) {
                removeSession(it.getToken());
            }
        });
    }

    public void addUser(AuthVo authVo) {
        if (StringUtils.isBlank(authVo.getName())) {
            throw new ErrorMsgException("name cannot be empty");
        }

        if (authVo.getPermissions() == null) {
            throw new ErrorMsgException("Permission cannot be empty");
        }
        authVo.setUpdateTime(new Date());
        AuthVo authVo1 = dbManager.getDbData().getAuths().stream().filter(it -> StringUtils.equals(it.getName(), authVo.getName())).findFirst().orElse(null);
        if (StringUtils.isBlank(authVo.getUserId())) {
            if (StringUtils.isBlank(authVo.getPassword())) {
                throw new ErrorMsgException("password cannot be empty");
            }
            authVo.setUserId(RandomCode.getUUIDString());
            if (authVo1 != null) {
                throw new ErrorMsgException("Username already exists");
            }
            dbManager.getDbData().getAuths().add(authVo);
        } else {

            if (authVo1 != null && !StringUtils.equals(authVo1.getUserId(), authVo.getUserId())) {
                throw new ErrorMsgException("Username already exists");
            }
            dbManager.getDbData().getAuths().stream().filter(it -> StringUtils.equals(it.getUserId(), authVo.getUserId()))
                    .findFirst().ifPresent(it -> {
                it.setName(authVo.getName());
                it.setPermissions(authVo.getPermissions());
                it.setStatus(authVo.isStatus());
                it.setEmail(authVo.getEmail());
                it.setUpdateTime(authVo.getUpdateTime());
            });
        }
        dbManager.saveData();
    }

    public Session login(String name, String password) {
        AuthVo authVo = dbManager.getDbData().getAuths().stream()
                .filter(it -> StringUtils.equals(it.getName(), name) && StringUtils.equals(it.getPassword(), password) && it.isStatus())
                .findFirst().orElse(null);
        if (authVo == null) {
            throw new ErrorMsgException("Incorrect username or password");
        } else {
            return addSession(authVo);
        }
    }

    public void removeUser(String id) {
        dbManager.getDbData().getAuths().removeIf(authVo -> StringUtils.equals(authVo.getUserId(), id));
        dbManager.saveData();
    }

    public void updatePassword(AuthVo authVo) {
        if (StringUtils.isBlank(authVo.getUserId())) {
            throw new ErrorMsgException("userid cannot be empty");
        }
        if (StringUtils.isBlank(authVo.getPassword())) {
            throw new ErrorMsgException("password cannot be empty");
        }

        dbManager.getDbData().getAuths().stream().filter(it -> StringUtils.equals(it.getUserId(), authVo.getUserId()))
                .findFirst().ifPresent(it -> {
            it.setPassword(authVo.getPassword());
        });
    }

    public List<AuthVo> getUsers() {
        return dbManager.getDbData().getAuths().stream().map(it -> {
            AuthVo copy = BeanConvert.copy(it, AuthVo.class);
            copy.setPassword(null);
            return copy;
        }).collect(Collectors.toList());
    }

}
