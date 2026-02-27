package so.morton.api.domain.member;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.RegisterMemberRequest;
import so.morton.api.api.controller.v1.request.UpdateMemberRequest;
import so.morton.api.storage.domain.member.MemberEntity;
import so.morton.api.storage.domain.member.MemberRepository;

import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final MemberFinder memberFinder;

    @Transactional
    public Member register(RegisterMemberRequest request) {
        memberRepository.findByUsername(request.username())
                .ifPresent(e -> { throw new CodeException(MemberExceptionCode.DUPLICATE_USERNAME); });

        memberRepository.findByPhone(request.phone())
                .ifPresent(e -> { throw new CodeException(MemberExceptionCode.DUPLICATE_PHONE); });

        MemberEntity member = MemberEntity.builder()
                .username(request.username())
                .name(request.name())
                .phone(request.phone())
                .picture(request.picture())
                .role(request.role())
                .build();

        MemberEntity saved = memberRepository.save(member);
        return Member.of(saved);
    }

    @Transactional(readOnly = true)
    public Member get(Long memberId) {
        return memberFinder.find(memberId);
    }

    @Transactional
    public Member update(Long memberId, UpdateMemberRequest request) {
        MemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        member.update(
                request.name(),
                request.picture(),
                request.role()
        );

        return Member.of(member);
    }

    @Transactional
    public void delete(Long memberId) {
        MemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        memberRepository.delete(member);
    }
}
