package to.bconnect.api.core.domain.member;

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
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.MemberRepository;

import java.time.LocalDate;
import java.time.Period;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberService {

    private static final int MIN_AGE = 15;

    private final MemberRepository memberRepository;
    private final AttachmentFinder attachmentFinder;
    private final AttachmentLinker attachmentLinker;
    private final MemberCleaner memberCleaner;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public Member get(AuthUser user) {
        return memberRepository.findById(user.id())
                .map(Member::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public CursorPage<Member> list(CursorLimit cursor) {
        val members = memberRepository.findAllBy(
                cursor.toScrollPosition(),
                cursor.toLimit(),
                cursor.toSort()
        );

        return CursorPage.from(
                members.map(Member::of),
                Member::id
        );
    }

    @Transactional(readOnly = true)
    public boolean checkUsername(String username) {
        return !memberRepository.existsByUsername(username);
    }

    @Transactional
    public Member register(String phone, RegisterMember command) {
        memberRepository.findByUsername(command.username())
                .ifPresent(it -> { throw new CodeException(MemberExceptionCode.DUPLICATE_USERNAME); });
        memberRepository.findByPhone(phone)
                .ifPresent(it -> { throw new CodeException(MemberExceptionCode.DUPLICATE_PHONE); });

        if (Period.between(command.birth(), LocalDate.now()).getYears() < MIN_AGE)
            throw new CodeException(MemberExceptionCode.UNDERAGE);

        val created = new MemberEntity(
                command.username(),
                command.name(),
                phone,
                command.birth(),
                command.marketingConsent(),
                command.roles()
        );

        memberRepository.save(created);
        eventPublisher.publishEvent(new MemberRegisteredEvent(created.getId()));
        return Member.of(created);
    }

    @Transactional
    public void update(AuthUser user, UpdateMember command) {
        val found = memberRepository.findById(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        found.update(command.name());
    }

    @Transactional
    public void updatePicture(AuthUser user, Long pictureId) {
        if (pictureId == null) {
            attachmentLinker.unlink(AttachmentReferenceType.MEMBER, user.id());
            return;
        }

        attachmentFinder.validateOwnership(user.id(), pictureId);
        attachmentLinker.unlink(AttachmentReferenceType.MEMBER, user.id());
        attachmentLinker.link(AttachmentReferenceType.MEMBER, user.id(), pictureId);
    }

    @Transactional
    public void withdraw(AuthUser user) {
        memberCleaner.clean(user);
        memberRepository.deleteById(user.id());
    }
}
