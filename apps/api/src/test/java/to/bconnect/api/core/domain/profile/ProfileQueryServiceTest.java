package to.bconnect.api.core.domain.profile;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.profile.ProfileRepository;
import to.bconnect.api.storage.recommendation.RecommendationRepository;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.*;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class ProfileQueryServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private ProfileQueryService profileQueryService;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private PostRepository postRepository;
    @Autowired private TaskRepository taskRepository;
    @Autowired private RecommendationRepository recommendationRepository;
    @Autowired private CoworkerRepository coworkerRepository;

    @Test
    @DisplayName("get - 프로필이 존재할 때 조회하면 비공개 추천서를 제외한 집계를 반환한다")
    void get_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val hider = memberRepository.save(MemberFactory.entity("member3", "01000001003", Role.CAREER));

        profileRepository.save(ProfileFactory.entity(member.getId()));
        val task = taskRepository.save(TaskFactory.entity(member.getId()));
        postRepository.save(PostFactory.entity(member.getId(), task.getId()));
        val shown = recommendationRepository.save(RecommendationFactory.entity(other.getId(), member.getId()));
        shown.show();
        recommendationRepository.save(RecommendationFactory.entity(hider.getId(), member.getId()));
        coworkerRepository.save(CoworkerFactory.entity(member.getId(), other.getId()));

        // when
        val found = profileQueryService.get(member.getId());

        // then
        assertThat(found.memberId()).isEqualTo(member.getId());
        assertThat(found.postCount()).isEqualTo(1L);
        assertThat(found.recommendationCount()).isEqualTo(1L);
        assertThat(found.coworkerCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("list - 프로필이 존재할 때 목록을 조회하면 최신순 페이지를 반환한다")
    void list_success() {
        // given
        val first = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val second = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));

        val profile = profileRepository.save(ProfileFactory.entity(first.getId()));
        profileRepository.save(ProfileFactory.entity(second.getId()));

        val cursor = CursorFactory.request(null, 2);

        // when
        val firstPage = profileQueryService.list(cursor);

        // then
        assertThat(firstPage.content()).hasSize(2);
        assertThat(firstPage.content().getFirst().memberId()).isEqualTo(second.getId());
        assertThat(firstPage.content().get(1).memberId()).isEqualTo(first.getId());
        assertThat(firstPage.hasNext()).isTrue();
        assertThat(firstPage.nextCursor()).isEqualTo(profile.getId());
    }

    @Test
    @DisplayName("get - 프로필이 없을 때 조회하면 NOT_FOUND로 실패한다")
    void get_fail_C005() {
        // when & then
        assertCodeException(() -> profileQueryService.get(MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }
}
