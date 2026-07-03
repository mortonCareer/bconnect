package to.bconnect.api.core.domain.member;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.AttachmentLinker;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.MemberRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final AttachmentLinker attachmentLinker;

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
    public Member register(String phone, RegisterMember command) {
        memberRepository.findByUsername(command.username())
                .ifPresent(it -> { throw new CodeException(MemberExceptionCode.DUPLICATE_USERNAME); });
        memberRepository.findByPhone(phone)
                .ifPresent(it -> { throw new CodeException(MemberExceptionCode.DUPLICATE_PHONE); });

        val created = new MemberEntity(
                command.username(),
                command.name(),
                phone,
                command.role()
        );

        memberRepository.save(created);
        attachmentLinker.relink(created.getId(), ReferenceType.MEMBER, created.getId(), command.pictureId());
        return Member.of(created);
    }

    @Transactional
    public void update(AuthUser user, UpdateMember command) {
        val found = memberRepository.findById(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        found.update(command.name());
        attachmentLinker.relink(user.id(), ReferenceType.MEMBER, user.id(), command.pictureId());
    }

    @Transactional
    public void withdraw(AuthUser user) {
        attachmentLinker.unlink(ReferenceType.MEMBER, List.of(user.id()));
        memberRepository.findById(user.id())
                .ifPresent(memberRepository::delete);
    }
}
