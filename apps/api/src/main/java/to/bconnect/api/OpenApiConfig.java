package to.bconnect.api;

import io.swagger.v3.core.jackson.ModelResolver;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    static {
        ModelResolver.enumsAsRef = true;
    }
}