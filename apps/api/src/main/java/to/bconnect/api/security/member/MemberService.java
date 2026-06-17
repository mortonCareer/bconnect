package to.bconnect.api.security.member;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.security.AuthUser;

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
    public Member register(RegisterMemberRequest request) {
        otpService.verifyToken(request.signupToken());

        memberRepository.findByUsername(request.username())
                .ifPresent(it -> { throw new CodeException(MemberExceptionCode.DUPLICATE_USERNAME); });

        memberRepository.findByPhone(request.phone())
                .ifPresent(it -> { throw new CodeException(MemberExceptionCode.DUPLICATE_PHONE); });

        val created = new MemberEntity(
                request.username(),
                request.name(),
                request.phone(),
                request.picture(),
                request.role()
        );

        memberRepository.save(created);
        return Member.of(created);
    }

    @Transactional
    public void update(AuthUser user, UpdateMemberRequest request) {
        val found = memberRepository.findById(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        found.update(
                request.name(),
                request.picture(),
                request.role()
        );
    }

    @Transactional
    public void withdraw(AuthUser user) {
        memberRepository.findById(user.id())
                .ifPresent(memberRepository::delete);
    }
}
