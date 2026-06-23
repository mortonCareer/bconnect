package to.bconnect.api.core.domain.credential;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.attachment.AttachmentQueryService;
import to.bconnect.api.security.AuthUser;
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
    private final AttachmentQueryService attachmentQueryService;

    @Transactional(readOnly = true)
    public List<Credential> list(Long memberId) {
        return credentialRepository.findByMemberId(memberId)
                .stream()
                .map(Credential::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Credential> listPublic(Long memberId) {
        // latest one per type
        return credentialRepository.findByMemberId(memberId)
                .stream()
                .filter(it -> it.getStatus() == CredentialStatus.ACCEPTED)
                .collect(Collectors.groupingBy(
                        CredentialEntity::getType,
                        Collectors.maxBy(Comparator.comparing(CredentialEntity::getCreatedAt))
                ))
                .values().stream()
                .flatMap(Optional::stream)
                .map(Credential::of)
                .toList();
    }

    @Transactional
    public Long create(AuthUser user, CreateCredential command) {
        if (command.attachmentId() != null)
            attachmentQueryService.get(user, command.attachmentId());

        val created = new CredentialEntity(
                user.id(),
                command.type(),
                command.expiredAt(),
                command.attachmentId()
        );

        return credentialRepository.save(created).getId();
    }

    @Transactional
    public void delete(AuthUser user, Long id) {
        credentialRepository.findById(id).ifPresent(it -> {
            if (!it.getMemberId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            credentialRepository.delete(it);
        });
    }

    @Transactional
    public void accept(Long id) {
        val found = credentialRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        found.accept();
    }

    @Transactional
    public void deny(Long id) {
        val found = credentialRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        found.deny();
    }
}