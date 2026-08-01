package to.bconnect.api.core.domain.coworker;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.CoworkerFactory;
import to.bconnect.api.support.fixture.CoworkerRequestFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.UserFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
@RecordApplicationEvents
class CoworkerRequestServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private CoworkerRequestService coworkerRequestService;
    @Autowired private CoworkerRequestRepository coworkerRequestRepository;
    @Autowired private CoworkerRepository coworkerRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private ApplicationEvents applicationEvents;

    @Test
    @DisplayName("create - 요청이 유효할 때 생성하면 요청이 저장된다")
    void create_success() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when
        val id = coworkerRequestService.create(user, to.getId());

        // then
        val found = coworkerRequestRepository.findById(id).orElseThrow();
        assertThat(found.getFromId()).isEqualTo(from.getId());
        assertThat(found.getToId()).isEqualTo(to.getId());
        assertThat(applicationEvents.stream(CoworkerRequestedEvent.class))
                .containsExactly(new CoworkerRequestedEvent(id, from.getId(), to.getId()));
        assertThat(applicationEvents.stream(CoworkerAcceptedEvent.class)).isEmpty();
    }

    @Test
    @DisplayName("create - 같은 대상에게 보낸 요청이 있을 때 생성하면 기존 요청 id를 반환한다")
    void create_success_duplicated() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = coworkerRequestRepository.save(CoworkerRequestFactory.entity(from.getId(), to.getId()));
        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when
        val id = coworkerRequestService.create(user, to.getId());

        // then
        assertThat(id).isEqualTo(created.getId());
        assertThat(coworkerRequestRepository.findAllByFromId(from.getId())).hasSize(1);
        assertThat(applicationEvents.stream(CoworkerRequestedEvent.class)).isEmpty();
    }

    @Test
    @DisplayName("create - 역방향 요청이 대기 중일 때 생성하면 요청이 자동 수락되어 동료가 된다")
    void create_success_reverse() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val reverse = coworkerRequestRepository.save(CoworkerRequestFactory.entity(to.getId(), from.getId()));
        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when
        val id = coworkerRequestService.create(user, to.getId());

        // then
        assertThat(id).isEqualTo(reverse.getId());
        assertThat(coworkerRequestRepository.findById(reverse.getId())).isEmpty();
        assertThat(coworkerRequestRepository.findAllByFromId(from.getId())).isEmpty();
        assertThat(coworkerRepository.existsByMembers(from.getId(), to.getId())).isTrue();
        assertThat(applicationEvents.stream(CoworkerAcceptedEvent.class))
                .containsExactly(new CoworkerAcceptedEvent(to.getId(), from.getId()));
        assertThat(applicationEvents.stream(CoworkerRequestedEvent.class)).isEmpty();
    }

    @Test
    @DisplayName("accept - 받은 요청이 있을 때 승낙하면 요청이 삭제되고 동료가 생성된다")
    void accept_success() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = coworkerRequestRepository.save(CoworkerRequestFactory.entity(from.getId(), to.getId()));
        val user = UserFactory.domain(to.getId(), Role.CAREER);

        // when
        coworkerRequestService.accept(user, created.getId());

        // then
        assertThat(coworkerRequestRepository.findById(created.getId())).isEmpty();
        assertThat(coworkerRepository.existsByMembers(from.getId(), to.getId())).isTrue();
        assertThat(applicationEvents.stream(CoworkerAcceptedEvent.class))
                .containsExactly(new CoworkerAcceptedEvent(from.getId(), to.getId()));
    }

    @Test
    @DisplayName("deny - 받은 요청이 있을 때 거절하면 요청이 삭제되고 동료는 생성되지 않는다")
    void deny_success() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = coworkerRequestRepository.save(CoworkerRequestFactory.entity(from.getId(), to.getId()));
        val user = UserFactory.domain(to.getId(), Role.CAREER);

        // when
        coworkerRequestService.deny(user, created.getId());

        // then
        assertThat(coworkerRequestRepository.findById(created.getId())).isEmpty();
        assertThat(coworkerRepository.existsByMembers(from.getId(), to.getId())).isFalse();
    }

    @Test
    @DisplayName("cancel - 보낸 요청이 있을 때 취소하면 요청이 삭제된다")
    void cancel_success() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = coworkerRequestRepository.save(CoworkerRequestFactory.entity(from.getId(), to.getId()));
        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when
        coworkerRequestService.cancel(user, created.getId());

        // then
        assertThat(coworkerRequestRepository.findById(created.getId())).isEmpty();
    }

    @Test
    @DisplayName("create - 대상 회원이 존재하지 않을 때 생성하면 NOT_FOUND로 실패한다")
    void create_fail_C005() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> coworkerRequestService.create(user, MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("create - 대상이 본인일 때 생성하면 SELF_REQUEST로 실패한다")
    void create_fail_CW001() {
        // given
        val user = UserFactory.domain(MISSING_ID, Role.CAREER);

        // when & then
        assertCodeException(() -> coworkerRequestService.create(user, MISSING_ID))
                .hasExceptionCode(CoworkerExceptionCode.SELF_REQUEST);
    }

    @Test
    @DisplayName("create - 이미 동료일 때 생성하면 ALREADY_COWORKER로 실패한다")
    void create_fail_CW002() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        coworkerRepository.save(CoworkerFactory.entity(from.getId(), to.getId()));
        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> coworkerRequestService.create(user, to.getId()))
                .hasExceptionCode(CoworkerExceptionCode.ALREADY_COWORKER);
    }

    @Test
    @DisplayName("accept - 받은 사람이 아닐 때 승낙하면 FORBIDDEN으로 실패한다")
    void accept_fail_C004() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = coworkerRequestRepository.save(CoworkerRequestFactory.entity(from.getId(), to.getId()));
        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> coworkerRequestService.accept(user, created.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("accept - 요청이 존재하지 않을 때 승낙하면 NOT_FOUND로 실패한다")
    void accept_fail_C005() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> coworkerRequestService.accept(user, MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("deny - 받은 사람이 아닐 때 거절하면 FORBIDDEN으로 실패한다")
    void deny_fail_C004() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = coworkerRequestRepository.save(CoworkerRequestFactory.entity(from.getId(), to.getId()));
        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> coworkerRequestService.deny(user, created.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("deny - 요청이 존재하지 않을 때 거절하면 NOT_FOUND로 실패한다")
    void deny_fail_C005() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> coworkerRequestService.deny(user, MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("cancel - 보낸 사람이 아닐 때 취소하면 FORBIDDEN으로 실패한다")
    void cancel_fail_C004() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = coworkerRequestRepository.save(CoworkerRequestFactory.entity(from.getId(), to.getId()));
        val user = UserFactory.domain(to.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> coworkerRequestService.cancel(user, created.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("cancel - 요청이 존재하지 않을 때 취소하면 NOT_FOUND로 실패한다")
    void cancel_fail_C005() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> coworkerRequestService.cancel(user, MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }
}
