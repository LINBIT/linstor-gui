package com.github.lihang941.minstor.service.biz.auth;

import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Accessors(chain = true)
@Data
public class DbData {

    private List<AuthVo> auths;

}
