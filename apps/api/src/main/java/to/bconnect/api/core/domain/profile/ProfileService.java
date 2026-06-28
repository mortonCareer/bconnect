package to.bconnect.api.core.domain.profile;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.attachment.AttachmentValidator;
import to.bconnect.api.storage.profile.ProfileEntity;
import to.bconnect.api.storage.profile.ProfileRepository;
import to.bconnect.api.security.AuthUser;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final AttachmentValidator attachmentValidator;

    @Transactional
    public Long create(AuthUser user, CreateProfile command) {
        if (profileRepository.existsByMemberId(user.id()))
            throw new CodeException(ProfileExceptionCode.ALREADY_EXISTS);

        if (!command.trades().contains(command.primaryTrade()))
            throw new CodeException(ProfileExceptionCode.INVALID_PRIMARY_TRADE);

        if (command.pictureId() != null)
            attachmentValidator.validate(user, command.pictureId());

        val created = new ProfileEntity(
                user.id(),
                command.primaryTrade(),
                command.trades(),
                command.experience(),
                command.headline(),
                command.about(),
                command.address(),
                command.pictureId()
        );

        return profileRepository.save(created).getId();
    }

    @Transactional
    public void update(AuthUser user, UpdateProfile command) {
        val found = profileRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        if (!command.trades().contains(command.primaryTrade()))
            throw new CodeException(ProfileExceptionCode.INVALID_PRIMARY_TRADE);

        found.update(
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

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.updateAbout(about);
    }

    @Transactional
    public void updatePicture(AuthUser user, Long pictureId) {
        val found = profileRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (pictureId != null)
            attachmentValidator.validate(user, pictureId);

        found.updatePicture(pictureId);
    }

    @Transactional
    public void delete(AuthUser user) {
        val optional = profileRepository.findByMemberId(user.id());
        if (optional.isEmpty())
            return;
        val found = optional.get();

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        profileRepository.delete(found);
    }
}
