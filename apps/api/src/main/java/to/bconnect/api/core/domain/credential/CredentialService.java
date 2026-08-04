package to.bconnect.api.core.domain.credential;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.domain.AttachmentFinder;
import to.bconnect.api.attachment.domain.AttachmentLinker;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.credential.CredentialEntity;
import to.bconnect.api.storage.credential.CredentialRepository;
import to.bconnect.api.storage.credential.CredentialStatus;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CredentialService {

    private final CredentialRepository credentialRepository;
    private final AttachmentFinder attachmentFinder;
    private final AttachmentLinker attachmentLinker;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<Credential> list(Long memberId) {
        return credentialRepository.findAllByMemberIdOrderByIdDesc(memberId)
                .stream()
                .map(Credential::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Credential> listLatestAccepted(Long memberId) {
        // latest one per type
        return credentialRepository.findAllByMemberIdOrderByIdDesc(memberId)
                .stream()
                .filter(it -> it.getStatus() == CredentialStatus.ACCEPTED)
                .collect(Collectors.groupingBy(
                        CredentialEntity::getType,
                        Collectors.maxBy(Comparator.comparing(CredentialEntity::getCreatedAt)
                                .thenComparing(CredentialEntity::getId))
                ))
                .values().stream()
                .flatMap(Optional::stream)
                .map(Credential::of)
                .toList();
    }

    @Transactional
    public Long create(AuthUser user, CreateCredential command) {
        if (command.attachmentId() != null)
            attachmentFinder.validateOwnership(user.id(), command.attachmentId());

        val created = new CredentialEntity(
                user.id(),
                command.type(),
                command.expiredAt(),
                command.note()
        );

        credentialRepository.save(created);
        if (command.attachmentId() != null)
            attachmentLinker.link(AttachmentReferenceType.CREDENTIAL, created.getId(), command.attachmentId());

        return created.getId();
    }

    @Transactional
    public void delete(AuthUser user, Long id) {
        val optional = credentialRepository.findById(id);
        if (optional.isEmpty())
            return;
        val found = optional.get();

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        attachmentLinker.unlink(AttachmentReferenceType.CREDENTIAL, found.getId());
        credentialRepository.delete(found);
    }

    @Transactional
    public void accept(Long id) {
        val found = credentialRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (found.getStatus() != CredentialStatus.PENDING)
            throw new CodeException(CredentialExceptionCode.INVALID_STATUS);

        found.accept();

        eventPublisher.publishEvent(
                new CredentialReviewedEvent(found.getId(), found.getMemberId(), CredentialStatus.ACCEPTED));
    }

    @Transactional
    public void deny(Long id) {
        val found = credentialRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (found.getStatus() != CredentialStatus.PENDING)
            throw new CodeException(CredentialExceptionCode.INVALID_STATUS);

        found.deny();

        eventPublisher.publishEvent(
                new CredentialReviewedEvent(found.getId(), found.getMemberId(), CredentialStatus.DENIED));
    }
}
