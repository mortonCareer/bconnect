package to.bconnect.api.core.domain.drive;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.attachment.domain.cleanup.AttachmentContextValidator;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.attachment.AttachmentContext;

@Component
@RequiredArgsConstructor
public class DriveAttachmentValidator implements AttachmentContextValidator {

    private final DriveFinder driveFinder;

    @Override
    public AttachmentContext context() {
        return AttachmentContext.DRIVE;
    }

    @Override
    public void validate(Long memberId, Long contextId) {
        if (!driveFinder.isMember(memberId, contextId) && !driveFinder.isOwner(memberId, contextId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
    }
}
