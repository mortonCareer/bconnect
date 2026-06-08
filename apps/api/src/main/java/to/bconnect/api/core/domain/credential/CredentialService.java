package to.bconnect.api.core.domain.credential;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.credential.CredentialEntity;
import to.bconnect.api.storage.credential.CredentialRepository;

import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.credential.CredentialStatus;
import to.bconnect.api.security.AuthUser;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CredentialService {

    private final CredentialRepository credentialRepository;

    @Transactional(readOnly = true)
    public List<Credential> list(Long memberId) {
        // latest one per type
        return credentialRepository.findByMemberId(memberId)
                .stream()
                .filter(e -> e.getStatus() == CredentialStatus.ACCEPTED)
                .collect(Collectors.groupingBy(
                        CredentialEntity::getType,
                        Collectors.maxBy(Comparator.comparing(CredentialEntity::getCreatedAt))
                ))
                .values().stream()
                .flatMap(Optional::stream)
                .map(this::toCredential)
                .toList();
    }

    @Transactional
    public Credential create(AuthUser user, CreateCredential command) {
        CredentialEntity entity = new CredentialEntity(
                user.id(),
                command.type(),
                command.expiredAt()
        );

        credentialRepository.save(entity);
        return toCredential(entity);
    }

    @Transactional
    public void delete(AuthUser user, Long id) {
        credentialRepository.findById(id).ifPresent(found -> {
            if (!found.getMemberId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            credentialRepository.delete(found);
        });
    }

    @Transactional
    public void accept(Long id) {
        CredentialEntity found = credentialRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        found.accept();
    }

    @Transactional
    public void deny(Long id) {
        CredentialEntity found = credentialRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        found.deny();
    }

    private Credential toCredential(CredentialEntity entity) {
        return new Credential(
                entity.getId(),
                entity.getMemberId(),
                entity.getType(),
                entity.getStatus(),
                entity.getExpiredAt(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}