package to.bconnect.api.core.domain;

import to.bconnect.api.storage.attachment.AttachmentContext;

public interface AttachmentContextValidator {

    AttachmentContext context();

    void validate(Long memberId, Long contextId);
}
