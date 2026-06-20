package to.bconnect.api.core.domain.attachment;

import org.springframework.stereotype.Component;
import to.bconnect.api.support.cloudfront.CloudFrontProperties;

import java.util.List;

import static to.bconnect.api.core.domain.attachment.AttachmentKeyUtils.key;

@Component
public class AttachmentUrlResolver {

    private static final String URL_FORMAT = "https://%s/%s"; // domain + key
    private final String domain;

    public AttachmentUrlResolver(CloudFrontProperties cloudFrontProperties) {
        this.domain = cloudFrontProperties.domain();
    }

    public String urlOf(Attachment attachment) {
        return URL_FORMAT.formatted(domain, attachment.key());
    }

    public String urlOf(Attachment attachment, ImageSize size) {
        return URL_FORMAT.formatted(domain, key(attachment, size));
    }

    public List<String> urlsOf(List<Attachment> attachments) {
        return attachments.stream().map(this::urlOf).toList();
    }

    public List<String> urlsOf(List<Attachment> attachments, ImageSize size) {
        return attachments.stream().map(it -> urlOf(it, size)).toList();
    }
}
