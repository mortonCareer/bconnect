package so.morton.api.domain.member;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.RegisterMemberRequest;
import so.morton.api.api.controller.v1.request.UpdateMemberRequest;
import so.morton.api.storage.domain.member.MemberEntity;
import so.morton.api.storage.domain.member.MemberRepository;
import so.morton.api.storage.value.EntityStatus;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final MemberFinder memberFinder;

    @Transactional
    public Member create(RegisterMemberRequest request) {
        MemberEntity entity = MemberEntity.builder()
                .username(request.username())
                .name(request.name())
                .phone(request.phone())
                .picture(request.picture())
                .primaryTrade(request.primaryTrade())
                .trades(request.trades())
                .experience(request.experience())
                .role(request.role())
                .headline(request.headline())
                .about(request.about())
                .address(request.address())
                .build();

        MemberEntity saved = memberRepository.save(entity);
        return Member.of(saved);
    }

    @Transactional(readOnly = true)
    public Member get(Long memberId) {
        return memberFinder.find(memberId);
    }

    @Transactional
    public Member update(Long memberId, UpdateMemberRequest request) {
        MemberEntity entity = memberRepository.findById(memberId)
                .filter(e -> e.getStatus() == EntityStatus.ACTIVE)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        entity.update(
                request.name(),
                request.phone(),
                request.picture(),
                request.primaryTrade(),
                request.trades(),
                request.experience(),
                request.headline(),
                request.about(),
                request.address()
        );

        return Member.of(entity);
    }

    @Transactional
    public void delete(Long memberId) {
        MemberEntity entity = memberRepository.findById(memberId)
                .filter(e -> e.getStatus() == EntityStatus.ACTIVE)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        entity.delete();
    }
}
