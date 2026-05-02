package so.morton.api.domain.member;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.member.MemberRepository;

import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.Collection;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MemberFinder {

    private final MemberRepository memberRepository;

    public Member find(Long memberId) {
        return memberRepository.findById(memberId)
                .map(Member::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public Member findByUsername(String username) {
        return memberRepository.findByUsername(username)
                .map(Member::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<Member> findAll() {
        return memberRepository.findAll()
                .stream()
                .map(Member::of)
                .toList();
    }

    public List<Member> findAllByIds(Collection<Long> memberIds) {
        return memberRepository.findByIdIn(memberIds)
                .stream()
                .map(Member::of)
                .toList();
    }
}
