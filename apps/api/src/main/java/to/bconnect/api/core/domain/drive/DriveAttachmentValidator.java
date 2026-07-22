package to.bconnect.api.core.domain.drive;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.attachment.domain.cleanup.AttachmentContextValidator;
import to.bconnect.api.storage.attachment.AttachmentContext;

@Component
@RequiredArgsConstructor
public class DriveAttachmentValidator implements AttachmentContextValidator {

    private final DriveValidator driveValidator;

    @Override
    public AttachmentContext context() {
        return AttachmentContext.DRIVE;
    }

    @Override
    public void validate(Long memberId, Long contextId) {
        driveValidator.validate(contextId, memberId);
    }
}
