package to.bconnect.api.security.member;

import org.springframework.stereotype.Component;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.attachment.AttachmentContextValidator;
import to.bconnect.api.storage.attachment.AttachmentContext;

@Component
public class MemberAttachmentValidator implements AttachmentContextValidator {

    @Override
    public AttachmentContext context() {
        return AttachmentContext.MEMBER;
    }

    @Override
    public void validate(Long memberId, Long contextId) {
        if (!memberId.equals(contextId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
    }
}
