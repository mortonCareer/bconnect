package to.bconnect.api.domain.member;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.api.controller.v1.request.RegisterMemberRequest;
import to.bconnect.api.api.controller.v1.request.UpdateMemberRequest;
import to.bconnect.api.storage.domain.member.MemberEntity;
import to.bconnect.api.storage.domain.member.MemberRepository;
import to.bconnect.api.support.security.User;

import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.support.security.otp.OtpService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final MemberFinder memberFinder;
    private final OtpService otpService;

    @Transactional(readOnly = true)
    public Member get(User user) {
        return memberFinder.find(user.id());
    }

    @Transactional(readOnly = true)
    public List<Member> listMembers() {
        return memberFinder.findAll();
    }

    @Transactional(readOnly = true)
    public boolean checkUsername(String username) {
        return !memberRepository.existsByUsername(username);
    }

    @Transactional
    public Member register(RegisterMemberRequest request) {
        String phone = otpService.consumeToken(request.signupToken());

        memberRepository.findByUsername(request.username())
                .ifPresent(e -> { throw new CodeException(MemberExceptionCode.DUPLICATE_USERNAME); });

        memberRepository.findByPhone(phone)
                .ifPresent(e -> { throw new CodeException(MemberExceptionCode.DUPLICATE_PHONE); });

        MemberEntity member = MemberEntity.builder()
                .username(request.username())
                .name(request.name())
                .phone(phone)
                .picture(request.picture())
                .role(request.role())
                .build();

        memberRepository.save(member);
        return Member.of(member);
    }

    @Transactional
    public void update(User user, UpdateMemberRequest request) {
        MemberEntity found = memberRepository.findById(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        found.update(
                request.name(),
                request.picture(),
                request.role()
        );
    }

    @Transactional
    public void withdraw(User user) {
        memberRepository.findById(user.id())
                .ifPresent(memberRepository::delete);
    }
}
