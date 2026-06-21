package to.bconnect.api.core.domain.attachment;

import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;

public interface AttachmentContextValidator {

    AttachmentContext context();

    void validate(AuthUser user, Long contextId);
}
