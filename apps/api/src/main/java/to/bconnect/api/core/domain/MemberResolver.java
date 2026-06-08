package to.bconnect.api.core.domain;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class MemberResolver {

    private final MemberRepository memberRepository;

    public Member find(Long memberId) {
        return memberRepository.findById(memberId)
                .map(this::toMember)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<Member> findAllByIds(Collection<Long> memberIds) {
        return memberRepository.findByIdIn(memberIds)
                .stream()
                .map(this::toMember)
                .toList();
    }

    public Map<Long, Member> map(Collection<Long> memberIds) {
        return memberRepository.findByIdIn(memberIds)
                .stream()
                .map(this::toMember)
                .collect(Collectors.toMap(Member::id, Function.identity()));
    }

    private Member toMember(MemberEntity entity) {
        return new Member(
                entity.getId(),
                entity.getUsername(),
                entity.getName(),
                entity.getPhone(),
                entity.getPicture(),
                entity.getRole(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
