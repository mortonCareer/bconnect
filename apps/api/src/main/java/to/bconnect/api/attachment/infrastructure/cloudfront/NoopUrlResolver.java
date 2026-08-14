package to.bconnect.api.attachment.infrastructure.cloudfront;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import to.bconnect.api.attachment.domain.UrlResolver;

@Component
@Profile({"local", "test"})
public class NoopUrlResolver implements UrlResolver {

    private static final String BASE_URL = "http://localhost";

    @Override
    public String resolve(String key) {
        return BASE_URL + "/" + key;
    }
}
