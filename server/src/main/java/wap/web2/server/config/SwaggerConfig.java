package wap.web2.server.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import wap.web2.server.attendance.dto.AttendanceRequests;

@Configuration
public class SwaggerConfig {

    @Value("${swagger.server-url}")
    private String SERVER_URL;

    @Bean
    public OpenApiCustomizer attendanceRequestSchemas() {
        return api -> {
            var schemas = api.getComponents().getSchemas();
            if (schemas == null) return;
            // swagger-core 2.2.15 omits additionalProperties=false on these DTO schemas.
            for (Class<?> request : List.of(AttendanceRequests.Create.class,
                AttendanceRequests.Update.class, AttendanceRequests.CheckIn.class)) {
                var declaration = request.getAnnotation(io.swagger.v3.oas.annotations.media.Schema.class);
                var schema = schemas.get(declaration.name());
                if (schema != null) schema.setAdditionalProperties(false);
            }
        };
    }

    @Bean
    public OpenAPI openAPI() {
        Server server = new Server();
        server.setUrl(SERVER_URL);
        server.setDescription("Production Server");

        return new OpenAPI()
            .info(new Info().title("waps").version("v1"))
            .addSecurityItem(new SecurityRequirement().addList("JWT"))
            .components(
                new Components().addSecuritySchemes(
                    "JWT",
                    new SecurityScheme()
                        .name("JWT")
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .in(SecurityScheme.In.HEADER)
                )
            )
            .servers(List.of(server));
    }
}
