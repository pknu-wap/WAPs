package wap.web2.server.observability;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.exception.GlobalExceptionHandler;
import wap.web2.server.global.security.UserPrincipal;

class RequestCorrelationFilterTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(new RequestCorrelationFilter())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void requestWithoutRequestIdGetsAssignedAndEchoedBack() throws Exception {
        MvcResult result = mockMvc.perform(get("/test/ok"))
                .andExpect(status().isOk())
                .andExpect(header().exists(RequestCorrelation.REQUEST_ID_HEADER))
                .andReturn();

        assertThat(result.getResponse().getHeader(RequestCorrelation.REQUEST_ID_HEADER)).isNotBlank();
    }

    @Test
    void requestWithRequestIdKeepsSameHeaderValue() throws Exception {
        mockMvc.perform(get("/test/ok").header(RequestCorrelation.REQUEST_ID_HEADER, "req-123"))
                .andExpect(status().isOk())
                .andExpect(header().string(RequestCorrelation.REQUEST_ID_HEADER, "req-123"));
    }

    @Test
    void failingRequestIncludesSameRequestIdInHeaderAndBody() throws Exception {
        MvcResult result = mockMvc.perform(get("/test/fail"))
                .andExpect(status().isInternalServerError())
                .andExpect(header().exists(RequestCorrelation.REQUEST_ID_HEADER))
                .andExpect(jsonPath("$.requestId").exists())
                .andReturn();

        String headerRequestId = result.getResponse().getHeader(RequestCorrelation.REQUEST_ID_HEADER);

        assertThat(headerRequestId).isNotBlank();
        assertThat(result.getResponse().getContentAsString()).contains(headerRequestId);
    }

    @Test
    void requestLoggingDoesNotFailForAuthenticatedRequests() throws Exception {
        UserPrincipal principal = new UserPrincipal(
                7L,
                "tester@example.com",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                principal.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        mockMvc.perform(get("/test/ok"))
                .andExpect(status().isOk());
    }

    @Test
    void actuatorHealthRequestBypassesCorrelationFilter() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist(RequestCorrelation.REQUEST_ID_HEADER));
    }

    @RestController
    static class TestController {

        @GetMapping("/test/ok")
        ResponseEntity<String> ok() {
            return ResponseEntity.ok("ok");
        }

        @GetMapping("/test/fail")
        ResponseEntity<String> fail() {
            throw new IllegalStateException("boom");
        }

        @GetMapping("/actuator/health")
        ResponseEntity<String> health() {
            return ResponseEntity.ok("healthy");
        }
    }
}
