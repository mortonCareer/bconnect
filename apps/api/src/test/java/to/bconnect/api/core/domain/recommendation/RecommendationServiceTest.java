package to.bconnect.api.core.domain.recommendation;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
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
class RecommendationServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private RecommendationService recommendationService;
    @Autowired private RecommendationRepository recommendationRepository;
    @Autowired private CoworkerRepository coworkerRepository;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("create - 동료 관계일 때 추천서를 작성하면 비공개 추천서가 저장된다")
    void create_success() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        coworkerRepository.save(CoworkerFactory.entity(from.getId(), to.getId()));
        val command = RecommendationFactory.command(to.getId());

        // when
        val created = recommendationService.create(UserFactory.domain(from.getId(), Role.CAREER), command);

        // then
        val found = recommendationRepository.findById(created).orElseThrow();
        assertThat(found.getFromId()).isEqualTo(from.getId());
        assertThat(found.getToId()).isEqualTo(to.getId());
        assertThat(found.getContent()).isEqualTo(command.content());
        assertThat(found.isVisible()).isFalse();
    }

    @Test
    @DisplayName("create - 대상 회원이 존재하지 않을 때 추천서를 작성하면 NOT_FOUND로 실패한다")
    void create_fail_C005() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when & then
        assertCodeException(() -> recommendationService.create(
                UserFactory.domain(from.getId(), Role.CAREER), RecommendationFactory.command(MISSING_ID)))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("create - 대상이 자신일 때 추천서를 작성하면 SELF_RECOMMENDATION으로 실패한다")
    void create_fail_RC001() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when & then
        assertCodeException(() -> recommendationService.create(
                UserFactory.domain(member.getId(), Role.CAREER), RecommendationFactory.command(member.getId())))
                .hasExceptionCode(RecommendationExceptionCode.SELF_RECOMMENDATION);
    }

    @Test
    @DisplayName("create - 동료가 아닐 때 추천서를 작성하면 NOT_COWORKER로 실패한다")
    void create_fail_RC002() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));

        // when & then
        assertCodeException(() -> recommendationService.create(
                UserFactory.domain(from.getId(), Role.CAREER), RecommendationFactory.command(to.getId())))
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

        // when & then
        assertCodeException(() -> recommendationService.create(
                UserFactory.domain(from.getId(), Role.CAREER), RecommendationFactory.command(to.getId())))
                .hasExceptionCode(RecommendationExceptionCode.ALREADY_EXISTS);
    }

    @Test
    @DisplayName("update - 본인이 작성한 추천서를 수정하면 내용이 갱신된다")
    void update_success() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));

        // when
        recommendationService.update(UserFactory.domain(from.getId(), Role.CAREER), created.getId(), "updated content");

        // then
        val found = recommendationRepository.findById(created.getId()).orElseThrow();
        assertThat(found.getContent()).isEqualTo("updated content");
    }

    @Test
    @DisplayName("update - 타인이 작성한 추천서를 수정하면 FORBIDDEN으로 실패한다")
    void update_fail_C004() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));

        // when & then
        assertCodeException(() -> recommendationService.update(
                UserFactory.domain(to.getId(), Role.CAREER), created.getId(), "updated content"))
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
    @DisplayName("delete - 본인이 작성한 추천서를 삭제하면 추천서가 제거된다")
    void delete_success() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));

        // when
        recommendationService.delete(UserFactory.domain(from.getId(), Role.CAREER), created.getId());

        // then
        assertThat(recommendationRepository.findById(created.getId())).isEmpty();
    }

    @Test
    @DisplayName("delete - 타인이 작성한 추천서를 삭제하면 FORBIDDEN으로 실패한다")
    void delete_fail_C004() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));

        // when & then
        assertCodeException(() -> recommendationService.delete(UserFactory.domain(to.getId(), Role.CAREER), created.getId()))
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
    @DisplayName("hide - 받은 추천서를 숨기면 비공개 상태가 된다")
    void hide_success() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));
        created.show();

        // when
        recommendationService.hide(UserFactory.domain(to.getId(), Role.CAREER), created.getId());

        // then
        val found = recommendationRepository.findById(created.getId()).orElseThrow();
        assertThat(found.isVisible()).isFalse();
    }

    @Test
    @DisplayName("hide - 받은 사람이 아닐 때 추천서를 숨기면 FORBIDDEN으로 실패한다")
    void hide_fail_C004() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));

        // when & then
        assertCodeException(() -> recommendationService.hide(UserFactory.domain(from.getId(), Role.CAREER), created.getId()))
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
    @DisplayName("show - 받은 추천서를 공개하면 공개 상태가 된다")
    void show_success() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));

        // when
        recommendationService.show(UserFactory.domain(to.getId(), Role.CAREER), created.getId());

        // then
        val found = recommendationRepository.findById(created.getId()).orElseThrow();
        assertThat(found.isVisible()).isTrue();
    }

    @Test
    @DisplayName("show - 받은 사람이 아닐 때 추천서를 공개하면 FORBIDDEN으로 실패한다")
    void show_fail_C004() {
        // given
        val from = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val to = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val created = recommendationRepository.save(RecommendationFactory.entity(from.getId(), to.getId()));

        // when & then
        assertCodeException(() -> recommendationService.show(UserFactory.domain(from.getId(), Role.CAREER), created.getId()))
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
