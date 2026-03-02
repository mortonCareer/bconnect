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
    public List<Credential> getAll(Long profileId) {
        // TODO 각 타입별로 가장 최근에 승인된 인증서만 필터링한다
        return credentialFinder.findByProfileId(profileId);
    }

    @Transactional
    public Credential create(User user, CreateCredentialRequest request) {
        Profile profile = profileFinder.findByMemberId(user.id());

        CredentialEntity credential = CredentialEntity.builder()
                .profileId(profile.id())
                .type(request.type())
                .build();

        credentialRepository.save(credential);
        return Credential.of(credential);
    }

    @Transactional
    public void delete(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());
        CredentialEntity found = credentialRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getProfileId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        credentialRepository.delete(found);
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
}