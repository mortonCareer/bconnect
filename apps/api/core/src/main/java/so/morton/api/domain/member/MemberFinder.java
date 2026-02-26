package so.morton.api.domain.member;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.member.MemberRepository;

import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Component
@RequiredArgsConstructor
public class MemberFinder {

    private final MemberRepository memberRepository;

    public Member find(Long memberId) {
        return memberRepository.findById(memberId)
                .filter(e -> !e.isDeleted())
                .map(Member::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public Member findByUsername(String username) {
        return memberRepository.findByUsername(username)
                .filter(e -> !e.isDeleted())
                .map(Member::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<Member> findAllActive() {
        return memberRepository.findAllByDeletedFalse()
                .stream()
                .map(Member::of)
                .toList();
    }
}
