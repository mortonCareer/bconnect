package to.bconnect.api.attachment.domain;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.AttachmentFactory;
import to.bconnect.api.support.fixture.MemberFactory;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class AttachmentLinkerTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private AttachmentLinker attachmentLinker;
    @Autowired private AttachmentRepository attachmentRepository;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("link - 완료된 첨부 목록일 때 연결하면 전체 참조가 저장되고 빈 목록은 무시된다")
    void link_list_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val first = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        first.complete();
        val second = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        second.complete();

        // when
        attachmentLinker.link(ReferenceType.MEMBER, member.getId(), List.of(first.getId(), second.getId()));
        attachmentLinker.link(ReferenceType.MEMBER, member.getId(), List.of(first.getId(), second.getId()));
        attachmentLinker.link(ReferenceType.MEMBER, member.getId(), List.of());

        // then
        assertThat(attachmentRepository.findById(first.getId()).orElseThrow().getReferenceId())
                .isEqualTo(member.getId());
        assertThat(attachmentRepository.findById(second.getId()).orElseThrow().getReferenceId())
                .isEqualTo(member.getId());
    }

    @Test
    @DisplayName("link - 존재하지 않는 첨부가 목록에 포함되면 NOT_FOUND로 실패한다")
    void link_list_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();

        // when & then
        assertCodeException(() -> attachmentLinker.link(ReferenceType.MEMBER, member.getId(),
                List.of(attachment.getId(), MISSING_ID)))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("link - 완료되지 않은 첨부가 목록에 포함되면 NOT_COMPLETED로 실패한다")
    void link_list_fail_AT004() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));

        // when & then
        assertCodeException(() -> attachmentLinker.link(ReferenceType.MEMBER, member.getId(),
                List.of(attachment.getId())))
                .hasExceptionCode(AttachmentExceptionCode.NOT_COMPLETED);
    }

    @Test
    @DisplayName("link - 다른 참조에 연결된 첨부가 목록에 포함되면 INVALID_LINKED로 실패한다")
    void link_list_fail_AT005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(ReferenceType.POST, 1L);

        // when & then
        assertCodeException(() -> attachmentLinker.link(ReferenceType.MEMBER, member.getId(),
                List.of(attachment.getId())))
                .hasExceptionCode(AttachmentExceptionCode.INVALID_LINKED);
    }

    @Test
    @DisplayName("link - 완료된 첨부일 때 연결하면 참조가 저장되고 재연결해도 연결이 유지된다")
    void link_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();

        // when
        attachmentLinker.link(ReferenceType.MEMBER, member.getId(), attachment.getId());
        attachmentLinker.link(ReferenceType.MEMBER, member.getId(), attachment.getId());

        // then
        val found = attachmentRepository.findById(attachment.getId()).orElseThrow();
        assertThat(found.getReferenceType()).isEqualTo(ReferenceType.MEMBER);
        assertThat(found.getReferenceId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("link - 첨부가 존재하지 않을 때 연결하면 NOT_FOUND로 실패한다")
    void link_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when & then
        assertCodeException(() -> attachmentLinker.link(ReferenceType.MEMBER, member.getId(), MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("link - 첨부 업로드가 완료되지 않았을 때 연결하면 NOT_COMPLETED로 실패한다")
    void link_fail_AT004() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));

        // when & then
        assertCodeException(() -> attachmentLinker.link(ReferenceType.MEMBER, member.getId(), attachment.getId()))
                .hasExceptionCode(AttachmentExceptionCode.NOT_COMPLETED);
    }

    @Test
    @DisplayName("link - 첨부가 다른 참조에 연결되어 있을 때 연결하면 INVALID_LINKED로 실패한다")
    void link_fail_AT005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(ReferenceType.POST, 1L);

        // when & then
        assertCodeException(() -> attachmentLinker.link(ReferenceType.MEMBER, member.getId(), attachment.getId()))
                .hasExceptionCode(AttachmentExceptionCode.INVALID_LINKED);
    }

    @Test
    @DisplayName("unlink - 참조 목록으로 해제하면 연결된 첨부의 참조가 모두 제거되고 빈 목록은 무시된다")
    void unlink_list_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val first = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        first.complete();
        first.link(ReferenceType.POST, 1L);
        val second = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        second.complete();
        second.link(ReferenceType.POST, 2L);

        // when
        attachmentLinker.unlink(ReferenceType.POST, List.of(1L, 2L));
        attachmentLinker.unlink(ReferenceType.POST, List.<Long>of());

        // then
        assertThat(attachmentRepository.findById(first.getId()).orElseThrow().getReferenceId()).isNull();
        assertThat(attachmentRepository.findById(second.getId()).orElseThrow().getReferenceId()).isNull();
    }

    @Test
    @DisplayName("unlink - 참조로 해제하면 연결된 첨부의 참조가 모두 제거된다")
    void unlink_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val first = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        first.complete();
        first.link(ReferenceType.MEMBER, member.getId());
        val second = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        second.complete();
        second.link(ReferenceType.MEMBER, member.getId());

        // when
        attachmentLinker.unlink(ReferenceType.MEMBER, member.getId());

        // then
        assertThat(attachmentRepository.findById(first.getId()).orElseThrow().getReferenceType()).isNull();
        assertThat(attachmentRepository.findById(second.getId()).orElseThrow().getReferenceType()).isNull();
    }

    @Test
    @DisplayName("unlink - 참조에 연결된 첨부를 지정 해제하면 참조가 제거된다")
    void unlink_attachment_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(ReferenceType.MEMBER, member.getId());

        // when
        attachmentLinker.unlink(ReferenceType.MEMBER, member.getId(), attachment.getId());

        // then
        val found = attachmentRepository.findById(attachment.getId()).orElseThrow();
        assertThat(found.getReferenceType()).isNull();
        assertThat(found.getReferenceId()).isNull();
    }

    @Test
    @DisplayName("unlink - 첨부가 존재하지 않을 때 지정 해제하면 NOT_FOUND로 실패한다")
    void unlink_attachment_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when & then
        assertCodeException(() -> attachmentLinker.unlink(ReferenceType.MEMBER, member.getId(), MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("unlink - 다른 참조에 연결된 첨부를 지정 해제하면 INVALID_LINKED로 실패한다")
    void unlink_attachment_fail_AT005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(ReferenceType.POST, 1L);

        // when & then
        assertCodeException(() -> attachmentLinker.unlink(ReferenceType.MEMBER, member.getId(), attachment.getId()))
                .hasExceptionCode(AttachmentExceptionCode.INVALID_LINKED);
    }
}
