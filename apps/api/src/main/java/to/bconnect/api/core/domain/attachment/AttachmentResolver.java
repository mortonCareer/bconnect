package to.bconnect.api.core.domain.attachment;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.support.cloudfront.CloudFrontProperties;

@Component
@RequiredArgsConstructor
public class AttachmentResolver {

    private final CloudFrontProperties properties;

    public String url(Attachment attachment, ImageSize size) {
        String key = AttachmentKeyUtils.key(
                attachment.context(), attachment.contextId(), attachment.type(),
                size, attachment.uuid(), attachment.ext());
        return "https://" + properties.domain() + "/" + key;
    }
}
