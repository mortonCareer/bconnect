package so.morton.api.domain.credential;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.CreateCredentialRequest;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.storage.domain.credential.CredentialEntity;
import so.morton.api.storage.domain.credential.CredentialRepository;

import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CredentialService {

    private final CredentialRepository credentialRepository;
    private final CredentialFinder credentialFinder;
    private final ProfileFinder profileFinder;

    @Transactional
    public Credential create(Long memberId, CreateCredentialRequest request) {
        Long profileId = profileFinder.resolveId(memberId);

        CredentialEntity entity = CredentialEntity.builder()
                .profileId(profileId)
                .type(request.type())
                .build();

        CredentialEntity saved = credentialRepository.save(entity);
        return Credential.of(saved);
    }

    @Transactional(readOnly = true)
    public List<Credential> getByProfileId(Long profileId) {
        return credentialFinder.findByProfileId(profileId);
    }

    @Transactional
    public Credential renew(Long credentialId, Long memberId) {
        Long profileId = profileFinder.resolveId(memberId);

        CredentialEntity entity = credentialRepository.findById(credentialId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!entity.getProfileId().equals(profileId)) {
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        }

        entity.renew();

        return Credential.of(entity);
    }

    @Transactional
    public void delete(Long credentialId, Long memberId) {
        Long profileId = profileFinder.resolveId(memberId);

        CredentialEntity entity = credentialRepository.findById(credentialId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!entity.getProfileId().equals(profileId)) {
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        }

        entity.delete();
    }

    @Transactional
    public Credential accept(Long credentialId) {
        CredentialEntity entity = credentialRepository.findById(credentialId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        entity.accept();

        return Credential.of(entity);
    }

    @Transactional
    public Credential deny(Long credentialId) {
        CredentialEntity entity = credentialRepository.findById(credentialId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        entity.deny();

        return Credential.of(entity);
    }
}