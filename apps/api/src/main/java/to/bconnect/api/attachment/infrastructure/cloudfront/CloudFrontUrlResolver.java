package to.bconnect.api.attachment.infrastructure.cloudfront;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CloudFrontUrlResolver {

    private final CloudFrontProperties properties;

    public String resolve(String key) {
        return "https://" + properties.domain() + "/" + key;
    }
}
