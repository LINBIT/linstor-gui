package com.github.lihang941.minstor.service.config;

import com.github.lihang941.minstor.service.RequestConstant;
import com.github.lihang941.minstor.service.utils.WebUtils;
import jdk.internal.loader.Resource;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.config.CorsRegistry;
import org.springframework.web.reactive.config.ResourceHandlerRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;

import static org.springframework.web.reactive.function.server.RequestPredicates.GET;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;
import static org.springframework.web.reactive.function.server.ServerResponse.ok;

/**
 * @author lihang
 * @date 2020/10/19
 */
@Slf4j
@Configuration
public class WebConfig {

    private static void addResourceHandlers(ResourceHandlerRegistry registry, String pattern, String path) {
        if (!registry.hasMappingForPattern(pattern)) {
            registry.addResourceHandler(pattern)
                    .addResourceLocations(path);
            log.info("Adding static resources Routing pattern: [{}] path: [{}]", pattern, path);
        }
    }

    @Bean
    public WebFluxConfigurer webFluxConfigurer(Environment environment, WebStaticProperties webStaticProperties) {
        return new WebFluxConfigurer() {
            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                WebConfig.addResourceHandlers(registry, "/swagger-ui/**", "classpath:/META-INF/resources/webjars/springfox-swagger-ui/");
                WebConfig.addResourceHandlers(registry, webStaticProperties.getPattern(), "file:" + webStaticProperties.getPath());
            }

            @Override
            public void addCorsMappings(CorsRegistry corsRegistry) {
                corsRegistry.addMapping("/**")
                        .allowedOrigins("*")
                        .allowedMethods("*")
                        .allowedHeaders("Origin", "X-Requested-With", "Accept", "User-Agent", "Content-Type", "Timestamp", RequestConstant.HEAD_USER_TOKEN)
                        .exposedHeaders("Origin", "X-Requested-With", "Accept", "User-Agent", "Content-Type", "Timestamp", RequestConstant.HEAD_USER_TOKEN)
                        .maxAge(3600);
            }
        };
    }


    @Bean
    public WebClient webClient(LinstorProperties linstorProperties, WebclientProperties webclientProperties) {
        return WebUtils.webClientFactory(linstorProperties.getAddr(), webclientProperties.getRequest(), webclientProperties.getResponse(), WebUtils.linstorErrorResponse());
    }


}
