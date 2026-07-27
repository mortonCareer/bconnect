package to.bconnect.api.core.domain.coworker;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;
import to.bconnect.api.storage.coworker.CoworkerStatus;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.CoworkerFactory;
import to.bconnect.api.support.fixture.CoworkerRequestFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.UserFactory;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class CoworkerServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private CoworkerService coworkerService;
    @Autowired private CoworkerRepository coworkerRepository;
    @Autowired private CoworkerRequestRepository coworkerRequestRepository;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("list - 동료가 있을 때 목록을 조회하면 상대방 회원 id로 정규화된 목록을 반환한다")
    void list_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val another = memberRepository.save(MemberFactory.entity("member3", "01000001003", Role.CAREER));
        coworkerRepository.save(CoworkerFactory.entity(member.getId(), other.getId()));
        coworkerRepository.save(CoworkerFactory.entity(another.getId(), member.getId()));

        // when
        val response = coworkerService.list(member.getId());

        // then
        assertThat(response).extracting(Coworker::memberId)
                .containsExactlyInAnyOrder(other.getId(), another.getId());
    }

    @Test
    @DisplayName("resolveStatus - 동료와 요청이 있을 때 상태를 조회하면 관계별 상태를 반환한다")
    void resolveStatus_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val another = memberRepository.save(MemberFactory.entity("member3", "01000001003", Role.CAREER));
        val requester = memberRepository.save(MemberFactory.entity("member4", "01000001004", Role.CAREER));
        coworkerRepository.save(CoworkerFactory.entity(member.getId(), other.getId()));
        coworkerRequestRepository.save(CoworkerRequestFactory.entity(member.getId(), another.getId()));
        coworkerRequestRepository.save(CoworkerRequestFactory.entity(requester.getId(), member.getId()));

        // when
        val coworker = coworkerService.resolveStatus(member.getId(), other.getId());
        val sent = coworkerService.resolveStatus(member.getId(), another.getId());
        val received = coworkerService.resolveStatus(member.getId(), requester.getId());
        val none = coworkerService.resolveStatus(member.getId(), MISSING_ID);

        // then
        assertThat(coworker).isEqualTo(CoworkerStatus.COWORKER);
        assertThat(sent).isEqualTo(CoworkerStatus.SENT);
        assertThat(received).isEqualTo(CoworkerStatus.RECEIVED);
        assertThat(none).isEqualTo(CoworkerStatus.NONE);
    }

    @Test
    @DisplayName("resolveStatusMap - 동료와 요청이 있을 때 상태 맵을 조회하면 대상별 상태를 반환한다")
    void resolveStatusMap_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val another = memberRepository.save(MemberFactory.entity("member3", "01000001003", Role.CAREER));
        val requester = memberRepository.save(MemberFactory.entity("member4", "01000001004", Role.CAREER));
        coworkerRepository.save(CoworkerFactory.entity(other.getId(), member.getId()));
        coworkerRequestRepository.save(CoworkerRequestFactory.entity(member.getId(), another.getId()));
        coworkerRequestRepository.save(CoworkerRequestFactory.entity(requester.getId(), member.getId()));

        // when
        val statuses = coworkerService.resolveStatusMap(member.getId(),
                List.of(other.getId(), another.getId(), requester.getId(), MISSING_ID));

        // then
        assertThat(statuses)
                .containsEntry(other.getId(), CoworkerStatus.COWORKER)
                .containsEntry(another.getId(), CoworkerStatus.SENT)
                .containsEntry(requester.getId(), CoworkerStatus.RECEIVED)
                .containsEntry(MISSING_ID, CoworkerStatus.NONE);
    }

    @Test
    @DisplayName("delete - 동료가 존재할 때 삭제하면 동료 관계가 제거된다")
    void delete_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = coworkerRepository.save(CoworkerFactory.entity(other.getId(), member.getId()));

        // when
        coworkerService.delete(UserFactory.domain(member.getId(), Role.CAREER), other.getId());

        // then
        assertThat(coworkerRepository.findById(created.getId())).isEmpty();
    }

    @Test
    @DisplayName("delete - 동료 관계가 존재하지 않을 때 삭제하면 NOT_FOUND로 실패한다")
    void delete_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when & then
        assertCodeException(() -> coworkerService.delete(UserFactory.domain(member.getId(), Role.CAREER), MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }
}
