package to.bconnect.api.core.domain.recommendation;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.recommendation.RecommendationRepository;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.RecommendationFactory;
import to.bconnect.api.support.fixture.UserFactory;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
class RecommendationQueryServiceTest {

    @Autowired private RecommendationQueryService recommendationQueryService;
    @Autowired private RecommendationRepository recommendationRepository;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("listReceived - 공개·비공개 추천서를 받았을 때 조회하면 공개된 추천서만 작성자 정보와 반환한다")
    void listReceived_success() {
        // given
        val other = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val member = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val another = memberRepository.save(MemberFactory.entity("member3", "01000001003", Role.CAREER));
        val shown = recommendationRepository.save(RecommendationFactory.entity(other.getId(), member.getId()));
        shown.show();
        recommendationRepository.save(RecommendationFactory.entity(another.getId(), member.getId()));
        val sent = recommendationRepository.save(RecommendationFactory.entity(member.getId(), other.getId()));
        sent.show();

        // when
        val response = recommendationQueryService.listReceived(member.getId());

        // then
        assertThat(response).extracting(Recommendation::id).containsExactly(shown.getId());
        assertThat(response.getFirst().memberId()).isEqualTo(other.getId());
        assertThat(response.getFirst().visible()).isTrue();
    }

    @Test
    @DisplayName("listSent - 공개·비공개 추천서를 보냈을 때 조회하면 공개된 추천서만 대상자 정보와 반환한다")
    void listSent_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val another = memberRepository.save(MemberFactory.entity("member3", "01000001003", Role.CAREER));
        val shown = recommendationRepository.save(RecommendationFactory.entity(member.getId(), other.getId()));
        shown.show();
        recommendationRepository.save(RecommendationFactory.entity(member.getId(), another.getId()));
        val received = recommendationRepository.save(RecommendationFactory.entity(other.getId(), member.getId()));
        received.show();

        // when
        val response = recommendationQueryService.listSent(member.getId());

        // then
        assertThat(response).extracting(Recommendation::id).containsExactly(shown.getId());
        assertThat(response.getFirst().memberId()).isEqualTo(other.getId());
        assertThat(response.getFirst().visible()).isTrue();
    }

    @Test
    @DisplayName("listMyReceived - 공개·비공개 추천서를 받았을 때 조회하면 비공개 추천서를 포함해 반환한다")
    void listMyReceived_success() {
        // given
        val other = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val member = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val another = memberRepository.save(MemberFactory.entity("member3", "01000001003", Role.CAREER));
        val shown = recommendationRepository.save(RecommendationFactory.entity(other.getId(), member.getId()));
        shown.show();
        val hidden = recommendationRepository.save(RecommendationFactory.entity(another.getId(), member.getId()));

        // when
        val response = recommendationQueryService.listMyReceived(UserFactory.domain(member.getId(), Role.CAREER));

        // then
        assertThat(response).extracting(Recommendation::id)
                .containsExactlyInAnyOrder(shown.getId(), hidden.getId());
        assertThat(response).extracting(Recommendation::memberId)
                .containsExactlyInAnyOrder(other.getId(), another.getId());
    }

    @Test
    @DisplayName("listMySent - 공개·비공개 추천서를 보냈을 때 조회하면 비공개 추천서를 포함해 반환한다")
    void listMySent_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val another = memberRepository.save(MemberFactory.entity("member3", "01000001003", Role.CAREER));
        val shown = recommendationRepository.save(RecommendationFactory.entity(member.getId(), other.getId()));
        shown.show();
        val hidden = recommendationRepository.save(RecommendationFactory.entity(member.getId(), another.getId()));

        // when
        val response = recommendationQueryService.listMySent(UserFactory.domain(member.getId(), Role.CAREER));

        // then
        assertThat(response).extracting(Recommendation::id)
                .containsExactlyInAnyOrder(shown.getId(), hidden.getId());
        assertThat(response).extracting(Recommendation::memberId)
                .containsExactlyInAnyOrder(other.getId(), another.getId());
    }
}
