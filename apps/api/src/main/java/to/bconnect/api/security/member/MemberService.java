package to.bconnect.api.security.member;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.security.AuthUser;

import to.bconnect.api.attachment.AttachmentValidator;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.otp.OtpService;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.MemberRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final OtpService otpService;
    private final AttachmentValidator attachmentValidator;

    @Transactional(readOnly = true)
    public Member get(AuthUser user) {
        return memberRepository.findById(user.id())
                .map(Member::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<Member> list() {
        return memberRepository.findAll()
                .stream()
                .map(Member::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean checkUsername(String username) {
        return !memberRepository.existsByUsername(username);
    }

    @Transactional
    public Member register(RegisterMember command) {
        otpService.verifyToken(command.signupToken());

        memberRepository.findByUsername(command.username())
                .ifPresent(it -> { throw new CodeException(MemberExceptionCode.DUPLICATE_USERNAME); });

        memberRepository.findByPhone(command.phone())
                .ifPresent(it -> { throw new CodeException(MemberExceptionCode.DUPLICATE_PHONE); });

        val created = new MemberEntity(
                command.username(),
                command.name(),
                command.phone(),
                command.pictureId(),
                command.role()
        );

        memberRepository.save(created);
        return Member.of(created);
    }

    @Transactional
    public void update(AuthUser user, UpdateMember command) {
        val found = memberRepository.findById(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (command.pictureId() != null)
            attachmentValidator.validate(user.id(), command.pictureId());

        found.update(
                command.name(),
                command.pictureId(),
                command.role()
        );
    }

    @Transactional
    public void withdraw(AuthUser user) {
        memberRepository.findById(user.id())
                .ifPresent(memberRepository::delete);
    }
}
