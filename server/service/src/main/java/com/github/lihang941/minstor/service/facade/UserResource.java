package com.github.lihang941.minstor.service.facade;

import com.github.lihang941.minstor.service.RequestConstant;
import com.github.lihang941.minstor.service.auth.Permissions;
import com.github.lihang941.minstor.service.biz.auth.AuthBiz;
import com.github.lihang941.minstor.service.biz.auth.AuthVo;
import com.github.lihang941.minstor.service.biz.auth.DbManager;
import com.github.lihang941.minstor.service.biz.linstor.vo.UserTypes;
import com.github.lihang941.minstor.service.config.LinstorProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import springfox.documentation.annotations.ApiIgnore;

import java.util.ArrayList;
import java.util.List;

@RestController
public class UserResource {


    @Autowired
    private AuthBiz authBiz;

    @Autowired
    private LinstorProperties linstorProperties;

    @PostMapping("/user/login")
    public Mono<UserTypes.LoginResult> login(@RequestBody UserTypes.LoginParam loginParam) {

        AuthBiz.Session login = authBiz.login(loginParam.getName(), loginParam.getPassword());

        return Mono.just(new UserTypes.LoginResult()
                .setToken(login.getToken())
                .setUserId(login.getAuthVo().getUserId())
                .setUserInfo(
                        getUserInfo(login)
                ));
    }

    private UserTypes.UserInfo getUserInfo(AuthBiz.Session login) {
        return new UserTypes.UserInfo()
                .setUserId(login.getAuthVo().getUserId())
                .setIntroduction(login.getAuthVo().getName())
                .setName(login.getAuthVo().getName())
                .setAvatar("https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif")
                .setRoles(
                        linstorProperties.getReadOnly() ?
                                new ArrayList<String>() {
                                    {
                                        addAll(login.getAuthVo().getPermissions());
                                        add("read");
                                    }
                                } : login.getAuthVo().getPermissions()
                );
    }

    @GetMapping("/users/permissions")
    public List<String> permissions() {
        return DbManager.PERMISSIONS;
    }


    @DeleteMapping("/user/logout")
    @Permissions
    public void logout(@ApiIgnore @RequestHeader(RequestConstant.HEAD_USER_TOKEN) String userToken) {
        authBiz.removeSession(userToken);
    }

    @GetMapping("/user/info")
    @Permissions
    public Mono<UserTypes.UserInfo> getUserInfo(@ApiIgnore @RequestHeader(RequestConstant.HEAD_USER_TOKEN) String userToken) {
        return Mono.just(getUserInfo(authBiz.getSession(userToken)));
    }


    @Permissions
    @GetMapping("/users")
    public List<AuthVo> users() {
        return authBiz.getUsers();
    }

    @Permissions
    @PostMapping("/users")
    public void addUser(@RequestBody AuthVo authVo) {
        authBiz.addUser(authVo);
    }

    @Permissions
    @DeleteMapping("/users/{userId}")
    public void removeUser(@PathVariable String userId) {
        authBiz.removeUser(userId);
    }

    @PostMapping("/user/updatePassword")
    @Permissions
    public void updatePassword(@RequestBody AuthVo authVo) {
        authBiz.updatePassword(authVo);
    }

}
