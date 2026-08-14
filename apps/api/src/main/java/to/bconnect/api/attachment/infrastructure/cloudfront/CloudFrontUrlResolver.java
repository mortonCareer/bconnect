package to.bconnect.api.attachment.infrastructure.cloudfront;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import to.bconnect.api.attachment.domain.UrlResolver;

@Component
@Profile({"prod", "dev"})
@RequiredArgsConstructor
public class CloudFrontUrlResolver implements UrlResolver {

    private final CloudFrontProperties properties;

    @Override
    public String resolve(String key) {
        return "https://" + properties.domain() + "/" + key;
    }
}
