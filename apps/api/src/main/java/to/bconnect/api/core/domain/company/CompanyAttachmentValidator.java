package to.bconnect.api.core.domain.company;

import org.springframework.stereotype.Component;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.AttachmentContextValidator;
import to.bconnect.api.storage.attachment.AttachmentContext;

@Component
public class CompanyAttachmentValidator implements AttachmentContextValidator {

    @Override
    public AttachmentContext context() {
        return AttachmentContext.COMPANY;
    }

    @Override
    public void validate(Long memberId, Long contextId) {
        if (!memberId.equals(contextId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
    }
}
