package to.bconnect.api.core.domain.attachment;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentEntity;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentStatus;

import java.util.Collection;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttachmentQueryService {

    private final AttachmentRepository attachmentRepository;

    @Transactional(readOnly = true)
    public Map<Long, Attachment> resolveMap(Collection<Long> attachmentIds) {
        return attachmentRepository.findAllById(attachmentIds).stream()
                .map(Attachment::of)
                .collect(Collectors.toMap(Attachment::id, Function.identity()));
    }

    @Transactional(readOnly = true)
    public Attachment get(AuthUser user, Long attachmentId) {
        AttachmentEntity attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new CodeException(AttachmentExceptionCode.NOT_FOUND));
        if (!attachment.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        if (attachment.getStatus() != AttachmentStatus.COMPLETED)
            throw new CodeException(AttachmentExceptionCode.NOT_COMPLETED);

        return Attachment.of(attachment);
    }
}
