package to.bconnect.api.core.domain.profile;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.profile.ProfileEntity;
import to.bconnect.api.storage.profile.ProfileRepository;
import to.bconnect.api.security.AuthUser;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public Long create(AuthUser user, CreateProfile command) {
        if (profileRepository.existsByMemberId(user.id()))
            throw new CodeException(ProfileExceptionCode.ALREADY_EXISTS);

        if (!command.trades().contains(command.primaryTrade()))
            throw new CodeException(ProfileExceptionCode.INVALID_PRIMARY_TRADE);

        val created = new ProfileEntity(
                user.id(),
                command.role(),
                command.primaryTrade(),
                command.trades(),
                command.experience(),
                command.headline(),
                command.about(),
                command.address()
        );

        val profileId = profileRepository.save(created).getId();

        memberRepository.findById(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND))
                .grantRole(Role.CAREER);

        return profileId;
    }

    @Transactional
    public void update(AuthUser user, UpdateProfile command) {
        val found = profileRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!command.trades().contains(command.primaryTrade()))
            throw new CodeException(ProfileExceptionCode.INVALID_PRIMARY_TRADE);

        found.update(
                command.role(),
                command.primaryTrade(),
                command.trades(),
                command.experience(),
                command.headline(),
                command.address()
        );
    }

    @Transactional
    public void updateAbout(AuthUser user, String about) {
        val found = profileRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        found.updateAbout(about);
    }
}
