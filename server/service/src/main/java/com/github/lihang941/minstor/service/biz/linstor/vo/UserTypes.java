package com.github.lihang941.minstor.service.biz.linstor.vo;

import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

public abstract class UserTypes {

    @Accessors(chain = true)
    @Data
    public static class LoginParam {
        private String name;
        private String password;
    }

    @Accessors(chain = true)
    @Data
    public static class LoginResult {
        private String userId;
        private String token;
        private UserInfo userInfo;
    }

    @Accessors(chain = true)
    @Data
    public static class UserInfo {
        private String userId;
        private String name;
        private String introduction;
        private String avatar;
        private List<String> roles;
    }


}
