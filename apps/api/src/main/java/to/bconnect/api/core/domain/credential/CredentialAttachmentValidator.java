package to.bconnect.api.core.domain.credential;

import org.springframework.stereotype.Component;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.attachment.AttachmentContextValidator;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;

@Component
public class CredentialAttachmentValidator implements AttachmentContextValidator {

    @Override
    public AttachmentContext context() {
        return AttachmentContext.CREDENTIAL;
    }

    @Override
    public void validate(AuthUser user, Long contextId) {
        if (!user.id().equals(contextId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
    }
}
