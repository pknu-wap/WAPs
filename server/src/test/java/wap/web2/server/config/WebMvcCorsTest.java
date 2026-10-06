package wap.web2.server.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

class WebMvcCorsTest {

    private final WebApplicationContextRunner context = new WebApplicationContextRunner()
        .withUserConfiguration(TestApplication.class);

    @TestConfiguration(proxyBeanMethods = false)
    @EnableWebMvc
    @Import({WebMvcConfig.class, TestController.class})
    static class TestApplication {}

    @RestController
    static class TestController {
        @GetMapping("/cors-test")
        String get() {
            return "ok";
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "https://feat-698-allow-preview-domains.dev.waps.im",
        "https://a1b2c3.dev.waps.im",
        "https://waps.store", "https://www.waps.store", "https://wapst.netlify.app",
        "https://waps.im", "https://dev.waps.im", "https://waps-deploy.netlify.app",
        "https://waps-web.netlify.app", "https://waps-develop.netlify.app",
        "http://localhost:3000", "http://localhost:8080"
    })
    void allowsPreviewAndExistingOriginsWithCredentials(String origin) {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).build();
            mvc.perform(options("/cors-test")
                    .header("Origin", origin)
                    .header("Access-Control-Request-Method", "POST")
                    .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", origin))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"))
                .andExpect(header().string("Access-Control-Max-Age", "3600"));
            mvc.perform(get("/cors-test").header("Origin", origin))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", origin))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        });
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "http://feat-698.dev.waps.im",
        "https://feat-698.dev.waps.im:8443",
        "https://feat-698.dev.waps.im.evil.example",
        "https://feat-698-dev.waps.im",
        "https://feat-698.waps.im",
        "https://evil.example", "null"
    })
    void rejectsOriginsOutsideAllowedDomains(String origin) {
        context.run(ctx -> {
            var mvc = MockMvcBuilders.webAppContextSetup(ctx).build();
            mvc.perform(options("/cors-test")
                    .header("Origin", origin)
                    .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
            mvc.perform(get("/cors-test").header("Origin", origin))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        });
    }
}
