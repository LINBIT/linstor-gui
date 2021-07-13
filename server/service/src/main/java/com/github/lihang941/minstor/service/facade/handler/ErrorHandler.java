package com.github.lihang941.minstor.service.facade.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.lihang941.minstor.service.utils.WebUtils;
import com.github.lihang941.tool.common.exception.ErrorMsgException;
import com.github.lihang941.tool.common.exception.TokenInvalidException;
import lombok.Data;
import lombok.experimental.Accessors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.ServerWebInputException;
import reactor.core.publisher.Mono;

@Component
@Slf4j
@RestControllerAdvice
public class ErrorHandler {

    @Autowired
    private ObjectMapper objectMapper;


    @ExceptionHandler(Throwable.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResult internalException(Throwable ex) {
        log.error("Internal System Error: " + ex.getMessage(), ex);
        return new ErrorResult().setCode(500).setMsg("Internal System Error");
    }

    @ExceptionHandler(ErrorMsgException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResult errorMsgException(ErrorMsgException ex) {
        log.info("ErrorMsgException :{}", ex.getErrorMessage());
        return new ErrorResult().setCode(ex.getCode()).setMsg(ex.getErrorMessage()).setRes(ex.getParams());
    }

    @ExceptionHandler(TokenInvalidException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErrorResult tokenInvalidException(TokenInvalidException ex) {
        log.info("TokenInvalidException :{}", ex.getErrorMessage());
        return new ErrorResult().setCode(401).setMsg(ex.getErrorMessage());
    }

    @ExceptionHandler(ServerWebInputException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResult webInputException(ServerWebInputException ex) {
        log.info("ServerWebInputException :{} {} {}", ex.getReason(), ex.toString());
        ex.printStackTrace();
        return new ErrorResult().setCode(400).setMsg(ex.getReason());
    }

    @ExceptionHandler(WebExchangeBindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResult webExchangeBindException(WebExchangeBindException ex) {
        log.info("webExchangeBindException :{} {} {}", ex.getReason(), ex.toString());
        ex.printStackTrace();
        return new ErrorResult().setCode(400).setMsg(ex.getFieldError().getDefaultMessage());
    }


    public Mono<Void> handleError(ServerWebExchange exchange, Throwable throwable) {
        HttpStatus httpStatus;
        Object result;
        if (throwable instanceof WebExchangeBindException) {
            httpStatus = HttpStatus.BAD_REQUEST;
            result = webExchangeBindException((WebExchangeBindException) throwable);
        } else if (throwable instanceof ErrorMsgException) {
            httpStatus = HttpStatus.BAD_REQUEST;
            result = errorMsgException((ErrorMsgException) throwable);
        } else if (throwable instanceof ServerWebInputException) {
            httpStatus = HttpStatus.BAD_REQUEST;
            result = webInputException((ServerWebInputException) throwable);
        } else if (throwable instanceof TokenInvalidException) {
            httpStatus = HttpStatus.UNAUTHORIZED;
            result = tokenInvalidException((TokenInvalidException) throwable);
        } else {
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
            result = internalException(throwable);
        }
        return WebUtils.writeJson(objectMapper, exchange, httpStatus, result);
    }


    @Accessors(chain = true)
    @Data
    public static class ErrorResult {
        private Integer code;
        private String msg;
        private Object res;
    }

}
