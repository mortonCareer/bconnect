package to.bconnect.api.core.domain.recommendation;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.recommendation.RecommendationRepository;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.CoworkerFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.RecommendationFactory;
import to.bconnect.api.support.fixture.UserFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
@RecordApplicationEvents
class RecommendationServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private RecommendationService recommendationService;
    @Autowired private RecommendationRepository recommendationRepository;
    @Autowired private CoworkerRepository coworkerRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private ApplicationEvents applicationEvents;

    @Test
    @DisplayName("create - 동료 관계일 때 추천서를 작성하면 비공개 추천서가 저장된다")
    void create_success() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        coworkerRepository.save(CoworkerFactory.entity(from.getId(), to.getId()));
        val command = RecommendationFactory.command(to.getId());
        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when
        val created = recommendationService.create(user, command);

        // then
        val found = recommendationRepository.findById(created).orElseThrow();
        assertThat(found.getFromId()).isEqualTo(from.getId());
        assertThat(found.getToId()).isEqualTo(to.getId());
        assertThat(found.isVisible()).isFalse();
        assertThat(applicationEvents.stream(RecommendationWrittenEvent.class))
                .containsExactly(new RecommendationWrittenEvent(created, from.getId(), to.getId()));
    }

    @Test
    @DisplayName("update - 본인이 작성한 추천서가 있을 때 수정하면 내용이 갱신된다")
    void update_success() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));

        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when
        recommendationService.update(user, created.getId(), "updated content");

        // then
        val found = recommendationRepository.findById(created.getId()).orElseThrow();
        assertThat(found.getContent()).isEqualTo("updated content");
    }

    @Test
    @DisplayName("delete - 본인이 작성한 추천서가 있을 때 삭제하면 추천서가 제거된다")
    void delete_success() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));

        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when
        recommendationService.delete(user, created.getId());

        // then
        assertThat(recommendationRepository.findById(created.getId())).isEmpty();
    }

    @Test
    @DisplayName("hide - 공개된 추천서를 받았을 때 숨기면 비공개 상태가 된다")
    void hide_success() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));
        created.show();
        val user = UserFactory.domain(to.getId(), Role.CAREER);

        // when
        recommendationService.hide(user, created.getId());

        // then
        val found = recommendationRepository.findById(created.getId()).orElseThrow();
        assertThat(found.isVisible()).isFalse();
    }

    @Test
    @DisplayName("show - 비공개 추천서를 받았을 때 공개하면 공개 상태가 된다")
    void show_success() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));

        val user = UserFactory.domain(to.getId(), Role.CAREER);

        // when
        recommendationService.show(user, created.getId());

        // then
        val found = recommendationRepository.findById(created.getId()).orElseThrow();
        assertThat(found.isVisible()).isTrue();
    }

    @Test
    @DisplayName("create - 대상 회원이 존재하지 않을 때 추천서를 작성하면 NOT_FOUND로 실패한다")
    void create_fail_C005() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val user = UserFactory.domain(from.getId(), Role.CAREER);
        val command = RecommendationFactory.command(MISSING_ID);

        // when & then
        assertCodeException(() -> recommendationService.create(user, command))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("create - 대상이 자신일 때 추천서를 작성하면 SELF_RECOMMENDATION으로 실패한다")
    void create_fail_RC001() {
        // given
        val user = UserFactory.domain(MISSING_ID, Role.CAREER);
        val command = RecommendationFactory.command(MISSING_ID);

        // when & then
        assertCodeException(() -> recommendationService.create(user, command))
                .hasExceptionCode(RecommendationExceptionCode.SELF_RECOMMENDATION);
    }

    @Test
    @DisplayName("create - 동료가 아닐 때 추천서를 작성하면 NOT_COWORKER로 실패한다")
    void create_fail_RC002() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val user = UserFactory.domain(from.getId(), Role.CAREER);
        val command = RecommendationFactory.command(to.getId());

        // when & then
        assertCodeException(() -> recommendationService.create(user, command))
                .hasExceptionCode(RecommendationExceptionCode.NOT_COWORKER);
    }

    @Test
    @DisplayName("create - 이미 추천서를 작성했을 때 다시 작성하면 ALREADY_EXISTS로 실패한다")
    void create_fail_RC003() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        coworkerRepository.save(CoworkerFactory.entity(from.getId(), to.getId()));
        recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));
        val user = UserFactory.domain(from.getId(), Role.CAREER);
        val command = RecommendationFactory.command(to.getId());

        // when & then
        assertCodeException(() -> recommendationService.create(user, command))
                .hasExceptionCode(RecommendationExceptionCode.ALREADY_EXISTS);
    }

    @Test
    @DisplayName("update - 타인이 작성한 추천서일 때 수정하면 FORBIDDEN으로 실패한다")
    void update_fail_C004() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));

        val user = UserFactory.domain(to.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> recommendationService.update(user, created.getId(), "updated content"))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("update - 추천서가 존재하지 않을 때 수정하면 NOT_FOUND로 실패한다")
    void update_fail_C005() {
        // given
        val user = UserFactory.domain(MISSING_ID, Role.CAREER);

        // when & then
        assertCodeException(() -> recommendationService.update(user, MISSING_ID, "updated content"))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("delete - 타인이 작성한 추천서일 때 삭제하면 FORBIDDEN으로 실패한다")
    void delete_fail_C004() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));

        val user = UserFactory.domain(to.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> recommendationService.delete(user, created.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("delete - 추천서가 존재하지 않을 때 삭제하면 NOT_FOUND로 실패한다")
    void delete_fail_C005() {
        // given
        val user = UserFactory.domain(MISSING_ID, Role.CAREER);

        // when & then
        assertCodeException(() -> recommendationService.delete(user, MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("hide - 받은 사람이 아닐 때 숨기면 FORBIDDEN으로 실패한다")
    void hide_fail_C004() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));

        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> recommendationService.hide(user, created.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("hide - 추천서가 존재하지 않을 때 숨기면 NOT_FOUND로 실패한다")
    void hide_fail_C005() {
        // given
        val user = UserFactory.domain(MISSING_ID, Role.CAREER);

        // when & then
        assertCodeException(() -> recommendationService.hide(user, MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("show - 받은 사람이 아닐 때 공개하면 FORBIDDEN으로 실패한다")
    void show_fail_C004() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));

        val user = UserFactory.domain(from.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> recommendationService.show(user, created.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("show - 추천서가 존재하지 않을 때 공개하면 NOT_FOUND로 실패한다")
    void show_fail_C005() {
        // given
        val user = UserFactory.domain(MISSING_ID, Role.CAREER);

        // when & then
        assertCodeException(() -> recommendationService.show(user, MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }
}
