package to.bconnect.api.attachment.domain;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentType;
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
class AttachmentFinderTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private AttachmentFinder attachmentFinder;
    @Autowired private AttachmentRepository attachmentRepository;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("get - 참조에 연결된 첨부일 때 조회하면 첨부를 반환한다")
    void get_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(ReferenceType.POST, member.getId());

        // when
        val found = attachmentFinder.get(ReferenceType.POST, member.getId(), attachment.getId());

        // then
        assertThat(found.id()).isEqualTo(attachment.getId());
        assertThat(found.referenceId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("list - 첨부 ID 목록이 있을 때 조회하면 전체 첨부를 반환한다")
    void list_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val first = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        val second = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));

        // when
        val response = attachmentFinder.list(List.of(first.getId(), second.getId()));

        // then
        assertThat(response).extracting(Attachment::id)
                .containsExactlyInAnyOrder(first.getId(), second.getId());
    }

    @Test
    @DisplayName("list - 참조에 첨부가 연결됐을 때 참조로 조회하면 연결된 첨부를 반환한다")
    void list_reference_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(ReferenceType.POST, member.getId());

        // when
        val response = attachmentFinder.list(ReferenceType.POST, member.getId());

        // then
        assertThat(response).extracting(Attachment::id).containsExactly(attachment.getId());
    }

    @Test
    @DisplayName("map - 참조에 첨부가 연결됐을 때 참조 목록으로 조회하면 참조별 첨부 하나를 매핑한다")
    void map_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val first = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        first.complete();
        first.link(ReferenceType.POST, 1L);
        val second = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        second.complete();
        second.link(ReferenceType.POST, 2L);

        // when
        val response = attachmentFinder.map(ReferenceType.POST, List.of(1L, 2L, MISSING_ID), AttachmentType.IMAGE);

        // then
        assertThat(response).containsOnlyKeys(1L, 2L);
        assertThat(response.get(1L).id()).isEqualTo(first.getId());
    }

    @Test
    @DisplayName("listMap - 참조에 첨부가 연결됐을 때 참조 목록으로 조회하면 참조별 첨부 목록을 매핑한다")
    void listMap_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val first = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        first.complete();
        first.link(ReferenceType.POST, 1L);
        val second = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        second.complete();
        second.link(ReferenceType.POST, 1L);

        // when
        val response = attachmentFinder.listMap(ReferenceType.POST, List.of(1L));

        // then
        assertThat(response.get(1L)).extracting(Attachment::id)
                .containsExactlyInAnyOrder(first.getId(), second.getId());
    }

    @Test
    @DisplayName("listMap - 타입이 다른 첨부가 있을 때 참조 목록과 타입으로 조회하면 해당 타입만 매핑한다")
    void listMap_type_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val image = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        image.complete();
        image.link(ReferenceType.POST, 1L);
        val file = attachmentRepository.save(AttachmentFactory.fileEntity(member.getId(), member.getId()));
        file.complete();
        file.link(ReferenceType.POST, 1L);

        // when
        val response = attachmentFinder.listMap(ReferenceType.POST, List.of(1L), AttachmentType.IMAGE);

        // then
        assertThat(response.get(1L)).extracting(Attachment::id).containsExactly(image.getId());
    }

    @Test
    @DisplayName("validateOwnership - 본인의 첨부일 때 검증하면 예외가 발생하지 않는다")
    void validateOwnership_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));

        // when & then
        assertThatCode(() -> attachmentFinder.validateOwnership(member.getId(), attachment.getId()))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("validateOwnership - 본인의 첨부 목록일 때 검증하면 예외가 발생하지 않는다")
    void validateOwnership_list_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val first = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        val second = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));

        // when & then
        assertThatCode(() -> attachmentFinder.validateOwnership(member.getId(), List.of(first.getId(), second.getId())))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("get - 참조 타입이 다른 첨부일 때 조회하면 INVALID_LINKED로 실패한다")
    void get_fail_AT005_type() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(ReferenceType.POST, 1L);

        // when & then
        assertCodeException(() -> attachmentFinder.get(ReferenceType.MEMBER, 1L, attachment.getId()))
                .hasExceptionCode(AttachmentExceptionCode.INVALID_LINKED);
    }

    @Test
    @DisplayName("get - 참조 식별자가 다른 첨부일 때 조회하면 INVALID_LINKED로 실패한다")
    void get_fail_AT005_id() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(ReferenceType.POST, 1L);

        // when & then
        assertCodeException(() -> attachmentFinder.get(ReferenceType.POST, 2L, attachment.getId()))
                .hasExceptionCode(AttachmentExceptionCode.INVALID_LINKED);
    }

    @Test
    @DisplayName("get - 첨부가 존재하지 않을 때 조회하면 NOT_FOUND로 실패한다")
    void get_fail_AT006() {
        // when & then
        assertCodeException(() -> attachmentFinder.get(ReferenceType.POST, 1L, MISSING_ID))
                .hasExceptionCode(AttachmentExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("list - 존재하지 않는 첨부가 포함되면 NOT_FOUND로 실패한다")
    void list_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));

        // when & then
        assertCodeException(() -> attachmentFinder.list(List.of(attachment.getId(), MISSING_ID)))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("validateOwnership - 타인의 첨부일 때 검증하면 FORBIDDEN으로 실패한다")
    void validateOwnership_fail_C004() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(other.getId(), other.getId()));

        // when & then
        assertCodeException(() -> attachmentFinder.validateOwnership(member.getId(), attachment.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("validateOwnership - 첨부가 존재하지 않을 때 검증하면 NOT_FOUND로 실패한다")
    void validateOwnership_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when & then
        assertCodeException(() -> attachmentFinder.validateOwnership(member.getId(), MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("validateOwnership - 타인의 첨부가 목록에 포함되면 FORBIDDEN으로 실패한다")
    void validateOwnership_list_fail_C004() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val owned = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        val notOwned = attachmentRepository.save(AttachmentFactory.entity(other.getId(), other.getId()));

        // when & then
        assertCodeException(() -> attachmentFinder.validateOwnership(member.getId(), List.of(owned.getId(), notOwned.getId())))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("validateOwnership - 존재하지 않는 첨부가 목록에 포함되면 NOT_FOUND로 실패한다")
    void validateOwnership_list_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));

        // when & then
        assertCodeException(() -> attachmentFinder.validateOwnership(member.getId(), List.of(attachment.getId(), MISSING_ID)))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }
}
