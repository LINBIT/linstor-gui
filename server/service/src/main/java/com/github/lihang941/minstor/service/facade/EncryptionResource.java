package com.github.lihang941.minstor.service.facade;

import com.github.lihang941.minstor.service.biz.linstor.EncryptionClient;
import com.github.lihang941.minstor.service.biz.linstor.vo.LinstorTypes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

//@RestController
public class EncryptionResource {

    @Autowired
    private EncryptionClient encryptionClient;

    @PostMapping("/v1/encryption/passphrase")
    public Mono<String> create(@RequestBody LinstorTypes.PassPhraseCreate passPhraseCreate) {
        return encryptionClient.create(passPhraseCreate);
    }

    @PutMapping("/v1/encryption/passphrase")
    public Mono<String> modify(@RequestBody LinstorTypes.PassPhraseCreate passPhraseCreate) {

        return encryptionClient.modify(passPhraseCreate);
    }

    @PatchMapping("/v1/encryption/passphrase")
    public Mono<String> enter(@RequestBody String password) {

        return encryptionClient.enter(password);
    }


}
