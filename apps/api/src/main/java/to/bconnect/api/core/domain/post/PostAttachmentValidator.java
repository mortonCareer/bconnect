package to.bconnect.api.core.domain.post;

import org.springframework.stereotype.Component;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.attachment.domain.cleanup.AttachmentContextValidator;
import to.bconnect.api.storage.attachment.AttachmentContext;

@Component
public class PostAttachmentValidator implements AttachmentContextValidator {

    @Override
    public AttachmentContext context() {
        return AttachmentContext.POST;
    }

    @Override
    public void validate(Long memberId, Long contextId) {
        if (!memberId.equals(contextId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
    }
}
