package com.github.lihang941.minstor.service.biz.linstor;

import com.github.lihang941.minstor.service.biz.linstor.vo.LinstorTypes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import static com.github.lihang941.minstor.service.utils.UrlUtils.buildQueryParam;

@Component
public class EncryptionClient {

    @Autowired
    private WebClient webClient;


    public Mono<String> create(LinstorTypes.PassPhraseCreate passPhraseCreate) {

        return webClient.post()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/encryption/passphrase").build())
                .bodyValue(passPhraseCreate)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> modify(LinstorTypes.PassPhraseCreate passPhraseCreate) {

        return webClient.put()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/encryption/passphrase").build())
                .bodyValue(passPhraseCreate)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> enter(String password) {

        return webClient.patch()
                .uri(uriBuilder ->
                        buildQueryParam(uriBuilder
                                , "/v1/encryption/passphrase").build())
                .bodyValue(password)
                .retrieve()
                .bodyToMono(String.class);
    }



}
