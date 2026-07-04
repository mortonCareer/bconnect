package to.bconnect.api.core.domain.member;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.member.MemberRepository;

import java.util.Collection;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class MemberResolver {

    private final MemberRepository memberRepository;

    public Member find(Long memberId) {
        return memberRepository.findById(memberId)
                .map(Member::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public Map<Long, Member> resolveMap(Collection<Long> memberIds) {
        return memberRepository.findAllByIdIn(memberIds)
                .stream()
                .map(Member::of)
                .collect(Collectors.toMap(Member::id, Function.identity()));
    }
}
