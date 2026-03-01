package so.morton.api.domain.credential;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.CreateCredentialRequest;
import so.morton.api.domain.profile.Profile;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.storage.domain.credential.CredentialEntity;
import so.morton.api.storage.domain.credential.CredentialRepository;
import so.morton.api.storage.value.CredentialType;

import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.auth.User;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CredentialService {

    private final CredentialRepository credentialRepository;
    private final CredentialFinder credentialFinder;
    private final ProfileFinder profileFinder;

    @Transactional(readOnly = true)
    public List<Credential> get(Long profileId) {
        // TODO 각 타입별로 가장 최근에 승인된 인증서만 필터링한다
        return credentialFinder.findByProfileId(profileId);
    }

    @Transactional
    public Credential create(User user, CreateCredentialRequest request) {
        Profile profile = profileFinder.getByMemberId(user.id());

        CredentialEntity entity = CredentialEntity.builder()
                .profileId(profile.id())
                .type(request.type())
                .build();

        credentialRepository.save(entity);
        return Credential.of(entity);
    }

    @Transactional
    public void delete(User user, Long id) {
        Profile profile = profileFinder.getByMemberId(user.id());
        CredentialEntity entity = credentialRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!entity.getProfileId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        credentialRepository.delete(entity);
    }

    @Transactional
    public void accept(Long id) {
        CredentialEntity entity = credentialRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        entity.accept();
    }

    @Transactional
    public void deny(Long id) {
        CredentialEntity entity = credentialRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        entity.deny();
    }
}