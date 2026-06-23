package to.bconnect.api.core.domain.attachment;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.support.cloudfront.CloudFrontProperties;

import java.util.Collection;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AttachmentResolver {

    private final AttachmentRepository attachmentRepository;
    private final CloudFrontProperties properties;

    @Transactional(readOnly = true)
    public Map<Long, Attachment> resolveMap(Collection<Long> attachmentIds) {
        return attachmentRepository.findAllById(attachmentIds).stream()
                .map(Attachment::of)
                .collect(Collectors.toMap(Attachment::id, Function.identity()));
    }

    public String url(Attachment attachment, ImageSize size) {
        if (attachment == null)
            return null;

        val key = AttachmentKeyUtils.key(
                attachment.context(), attachment.contextId(), attachment.type(),
                size, attachment.uuid(), attachment.ext());
        return "https://" + properties.domain() + "/" + key;
    }
}
