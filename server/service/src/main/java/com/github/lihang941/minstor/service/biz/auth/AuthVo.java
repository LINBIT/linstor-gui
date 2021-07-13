package com.github.lihang941.minstor.service.biz.auth;

import lombok.Data;
import lombok.experimental.Accessors;

import java.util.Date;
import java.util.List;

@Accessors(chain = true)
@Data
public class AuthVo {
    private String userId;
    private String name;
    private String email;
    private String password;
    private boolean status;
    private Date updateTime;
    private List<String> permissions;
}
