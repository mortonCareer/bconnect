package so.morton.api.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import so.morton.api.api.controller.v1.request.CreateRecommendationRequest;
import so.morton.api.domain.coworker.CoworkerFinder;
import so.morton.api.domain.member.Member;
import so.morton.api.domain.member.MemberFinder;
import so.morton.api.domain.profile.Profile;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.domain.recommendation.Recommendation;
import so.morton.api.domain.recommendation.RecommendationDetail;
import so.morton.api.domain.recommendation.RecommendationExceptionCode;
import so.morton.api.domain.recommendation.RecommendationFinder;
import so.morton.api.domain.recommendation.RecommendationService;
import so.morton.api.storage.domain.recommendation.RecommendationEntity;
import so.morton.api.storage.domain.recommendation.RecommendationRepository;
import so.morton.api.storage.value.Role;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.auth.User;
import so.morton.api.support.fixture.MemberFactory;
import so.morton.api.support.fixture.ProfileFactory;
import so.morton.api.support.fixture.RecommendationFactory;
import so.morton.api.support.fixture.UserFactory;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static so.morton.api.support.CodeExceptionAssert.assertCodeException;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecommendationService 테스트")
class RecommendationServiceTest {

    @Mock private RecommendationRepository recommendationRepository;
    @Mock private RecommendationFinder recommendationFinder;
    @Mock private ProfileFinder profileFinder;
    @Mock private MemberFinder memberFinder;
    @Mock private CoworkerFinder coworkerFinder;
    @InjectMocks private RecommendationService recommendationService;

    private static final Long USER_A_ID = 1L;
    private static final Long USER_B_ID = 2L;
    private static final Long PROFILE_A_ID = 1L;
    private static final Long PROFILE_B_ID = 2L;
    private static final Long MEMBER_A_ID = 1L;
    private static final Long MEMBER_B_ID = 2L;
    private static final Long RECOMMENDATION_ID = 1L;
    private static final User USER_A = UserFactory.create(USER_A_ID, Role.FOREMAN);
    private static final User USER_B = UserFactory.create(USER_B_ID, Role.FOREMAN);

    @Nested
    @DisplayName("RecommendationService.create")
    class CreateTests {

        @Test
        @DisplayName("생성 성공")
        void create_success() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, MEMBER_A_ID);
            CreateRecommendationRequest request = RecommendationFactory.createRequest(PROFILE_B_ID);
            RecommendationEntity savedEntity = RecommendationFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(savedEntity, "id", RECOMMENDATION_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(coworkerFinder.isCoworker(PROFILE_A_ID, PROFILE_B_ID)).thenReturn(true);
            when(recommendationRepository.existsByFromIdAndToId(PROFILE_A_ID, PROFILE_B_ID)).thenReturn(false);
            when(recommendationRepository.save(any(RecommendationEntity.class))).thenReturn(savedEntity);

            // when
            Recommendation result = recommendationService.create(USER_A, request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(RECOMMENDATION_ID);
            assertThat(result.fromId()).isEqualTo(PROFILE_A_ID);
            assertThat(result.toId()).isEqualTo(PROFILE_B_ID);
            verify(recommendationRepository).save(any(RecommendationEntity.class));
        }

        @Test
        @DisplayName("자기 추천 시 SELF_RECOMMENDATION")
        void create_selfRecommendation() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, MEMBER_A_ID);
            CreateRecommendationRequest request = RecommendationFactory.createRequest(PROFILE_A_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);

            // when & then
            assertCodeException(() -> recommendationService.create(USER_A, request))
                    .hasExceptionCode(RecommendationExceptionCode.SELF_RECOMMENDATION);
            verify(recommendationRepository, never()).save(any());
        }

        @Test
        @DisplayName("동료 아닌 경우 NOT_COWORKER")
        void create_notCoworker() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, MEMBER_A_ID);
            CreateRecommendationRequest request = RecommendationFactory.createRequest(PROFILE_B_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(coworkerFinder.isCoworker(PROFILE_A_ID, PROFILE_B_ID)).thenReturn(false);

            // when & then
            assertCodeException(() -> recommendationService.create(USER_A, request))
                    .hasExceptionCode(RecommendationExceptionCode.NOT_COWORKER);
            verify(recommendationRepository, never()).save(any());
        }

        @Test
        @DisplayName("이미 추천 시 ALREADY_EXISTS")
        void create_alreadyExists() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, MEMBER_A_ID);
            CreateRecommendationRequest request = RecommendationFactory.createRequest(PROFILE_B_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(coworkerFinder.isCoworker(PROFILE_A_ID, PROFILE_B_ID)).thenReturn(true);
            when(recommendationRepository.existsByFromIdAndToId(PROFILE_A_ID, PROFILE_B_ID)).thenReturn(true);

            // when & then
            assertCodeException(() -> recommendationService.create(USER_A, request))
                    .hasExceptionCode(RecommendationExceptionCode.ALREADY_EXISTS);
            verify(recommendationRepository, never()).save(any());
        }

        @Test
        @DisplayName("프로필 미존재 시 NOT_FOUND")
        void create_profileNotFound() {
            // given
            CreateRecommendationRequest request = RecommendationFactory.createRequest(PROFILE_B_ID);

            when(profileFinder.findByMemberId(USER_A_ID))
                    .thenThrow(new CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            assertCodeException(() -> recommendationService.create(USER_A, request))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(recommendationRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("RecommendationService.update")
    class UpdateTests {

        @Test
        @DisplayName("수정 성공")
        void update_success() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, MEMBER_A_ID);
            RecommendationEntity entity = RecommendationFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(entity, "id", RECOMMENDATION_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(recommendationRepository.findById(RECOMMENDATION_ID)).thenReturn(Optional.of(entity));

            // when
            recommendationService.update(USER_A, RECOMMENDATION_ID, "Updated content");

            // then
            assertThat(entity.getContent()).isEqualTo("Updated content");
            verify(profileFinder).findByMemberId(USER_A_ID);
            verify(recommendationRepository).findById(RECOMMENDATION_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void update_notFound() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, MEMBER_A_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(recommendationRepository.findById(RECOMMENDATION_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> recommendationService.update(USER_A, RECOMMENDATION_ID, "Updated content"))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(profileFinder).findByMemberId(USER_A_ID);
            verify(recommendationRepository).findById(RECOMMENDATION_ID);
        }

        @Test
        @DisplayName("타인 수정 시 FORBIDDEN")
        void update_forbidden() {
            // given -- B가 A->B 추천서를 수정 시도 (fromId != profileB.id)
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, MEMBER_B_ID);
            RecommendationEntity entity = RecommendationFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(entity, "id", RECOMMENDATION_ID);

            when(profileFinder.findByMemberId(USER_B_ID)).thenReturn(profileB);
            when(recommendationRepository.findById(RECOMMENDATION_ID)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> recommendationService.update(USER_B, RECOMMENDATION_ID, "Updated content"))
                    .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
            verify(profileFinder).findByMemberId(USER_B_ID);
            verify(recommendationRepository).findById(RECOMMENDATION_ID);
        }
    }

    @Nested
    @DisplayName("RecommendationService.delete")
    class DeleteTests {

        @Test
        @DisplayName("삭제 성공")
        void delete_success() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, MEMBER_A_ID);
            RecommendationEntity entity = RecommendationFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(entity, "id", RECOMMENDATION_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(recommendationRepository.findById(RECOMMENDATION_ID)).thenReturn(Optional.of(entity));

            // when
            recommendationService.delete(USER_A, RECOMMENDATION_ID);

            // then
            verify(profileFinder).findByMemberId(USER_A_ID);
            verify(recommendationRepository).findById(RECOMMENDATION_ID);
            verify(recommendationRepository).delete(entity);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void delete_notFound() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, MEMBER_A_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(recommendationRepository.findById(RECOMMENDATION_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> recommendationService.delete(USER_A, RECOMMENDATION_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(recommendationRepository, never()).delete(any());
        }

        @Test
        @DisplayName("타인 삭제 시 FORBIDDEN")
        void delete_forbidden() {
            // given -- B가 A->B 추천서를 삭제 시도 (fromId != profileB.id)
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, MEMBER_B_ID);
            RecommendationEntity entity = RecommendationFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(entity, "id", RECOMMENDATION_ID);

            when(profileFinder.findByMemberId(USER_B_ID)).thenReturn(profileB);
            when(recommendationRepository.findById(RECOMMENDATION_ID)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> recommendationService.delete(USER_B, RECOMMENDATION_ID))
                    .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
            verify(recommendationRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("RecommendationService.hide")
    class HideTests {

        @Test
        @DisplayName("숨김 성공")
        void hide_success() {
            // given -- B가 A->B 추천서를 숨김 (toId == profileB.id)
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, MEMBER_B_ID);
            RecommendationEntity entity = RecommendationFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(entity, "id", RECOMMENDATION_ID);
            ReflectionTestUtils.setField(entity, "visible", true);

            when(profileFinder.findByMemberId(USER_B_ID)).thenReturn(profileB);
            when(recommendationRepository.findById(RECOMMENDATION_ID)).thenReturn(Optional.of(entity));

            // when
            recommendationService.hide(USER_B, RECOMMENDATION_ID);

            // then
            assertThat(entity.isVisible()).isFalse();
            verify(profileFinder).findByMemberId(USER_B_ID);
            verify(recommendationRepository).findById(RECOMMENDATION_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void hide_notFound() {
            // given
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, MEMBER_B_ID);

            when(profileFinder.findByMemberId(USER_B_ID)).thenReturn(profileB);
            when(recommendationRepository.findById(RECOMMENDATION_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> recommendationService.hide(USER_B, RECOMMENDATION_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
        }

        @Test
        @DisplayName("작성자 숨김 시 FORBIDDEN")
        void hide_forbidden() {
            // given -- A가 A->B 추천서를 숨김 시도 (toId != profileA.id)
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, MEMBER_A_ID);
            RecommendationEntity entity = RecommendationFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(entity, "id", RECOMMENDATION_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(recommendationRepository.findById(RECOMMENDATION_ID)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> recommendationService.hide(USER_A, RECOMMENDATION_ID))
                    .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
        }
    }

    @Nested
    @DisplayName("RecommendationService.show")
    class ShowTests {

        @Test
        @DisplayName("숨김 해제 성공")
        void show_success() {
            // given -- B가 A->B 추천서를 공개 (toId == profileB.id)
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, MEMBER_B_ID);
            RecommendationEntity entity = RecommendationFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(entity, "id", RECOMMENDATION_ID);

            when(profileFinder.findByMemberId(USER_B_ID)).thenReturn(profileB);
            when(recommendationRepository.findById(RECOMMENDATION_ID)).thenReturn(Optional.of(entity));

            // when
            recommendationService.show(USER_B, RECOMMENDATION_ID);

            // then
            assertThat(entity.isVisible()).isTrue();
            verify(profileFinder).findByMemberId(USER_B_ID);
            verify(recommendationRepository).findById(RECOMMENDATION_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void show_notFound() {
            // given
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, MEMBER_B_ID);

            when(profileFinder.findByMemberId(USER_B_ID)).thenReturn(profileB);
            when(recommendationRepository.findById(RECOMMENDATION_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> recommendationService.show(USER_B, RECOMMENDATION_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
        }

        @Test
        @DisplayName("작성자 공개 시 FORBIDDEN")
        void show_forbidden() {
            // given -- A가 A->B 추천서를 공개 시도 (toId != profileA.id)
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, MEMBER_A_ID);
            RecommendationEntity entity = RecommendationFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(entity, "id", RECOMMENDATION_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(recommendationRepository.findById(RECOMMENDATION_ID)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> recommendationService.show(USER_A, RECOMMENDATION_ID))
                    .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
        }
    }

    @Nested
    @DisplayName("RecommendationService.getReceived")
    class GetReceivedTests {

        @Test
        @DisplayName("조회 성공 -- counterpart=fromId(작성자) 조립")
        void getReceived_success() {
            // given -- B가 A로부터 받은 추천서 1건 (visible=true)
            Recommendation recommendation = RecommendationFactory.create(RECOMMENDATION_ID, PROFILE_A_ID, PROFILE_B_ID);
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, MEMBER_A_ID);
            Member memberA = MemberFactory.create(MEMBER_A_ID);

            when(recommendationFinder.findReceived(PROFILE_B_ID)).thenReturn(List.of(recommendation));
            when(profileFinder.findByIds(List.of(PROFILE_A_ID))).thenReturn(List.of(profileA));
            when(memberFinder.findByIds(List.of(MEMBER_A_ID))).thenReturn(List.of(memberA));

            // when
            List<RecommendationDetail> result = recommendationService.getReceived(PROFILE_B_ID);

            // then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).id()).isEqualTo(RECOMMENDATION_ID);
            assertThat(result.get(0).member()).isEqualTo(memberA);
            assertThat(result.get(0).profile()).isEqualTo(profileA);
            verify(recommendationFinder).findReceived(PROFILE_B_ID);
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void getReceived_empty() {
            // given
            when(recommendationFinder.findReceived(PROFILE_B_ID)).thenReturn(List.of());

            // when
            List<RecommendationDetail> result = recommendationService.getReceived(PROFILE_B_ID);

            // then
            assertThat(result).isEmpty();
            verify(recommendationFinder).findReceived(PROFILE_B_ID);
            verify(profileFinder, never()).findByIds(any());
            verify(memberFinder, never()).findByIds(any());
        }
    }

    @Nested
    @DisplayName("RecommendationService.getSent")
    class GetSentTests {

        @Test
        @DisplayName("조회 성공 -- counterpart=toId(수신자) 조립")
        void getSent_success() {
            // given -- A가 B에게 보낸 추천서 1건 (visible=true)
            Recommendation recommendation = RecommendationFactory.create(RECOMMENDATION_ID, PROFILE_A_ID, PROFILE_B_ID);
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, MEMBER_B_ID);
            Member memberB = MemberFactory.create(MEMBER_B_ID);

            when(recommendationFinder.findSent(PROFILE_A_ID)).thenReturn(List.of(recommendation));
            when(profileFinder.findByIds(List.of(PROFILE_B_ID))).thenReturn(List.of(profileB));
            when(memberFinder.findByIds(List.of(MEMBER_B_ID))).thenReturn(List.of(memberB));

            // when
            List<RecommendationDetail> result = recommendationService.getSent(PROFILE_A_ID);

            // then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).id()).isEqualTo(RECOMMENDATION_ID);
            assertThat(result.get(0).member()).isEqualTo(memberB);
            assertThat(result.get(0).profile()).isEqualTo(profileB);
            verify(recommendationFinder).findSent(PROFILE_A_ID);
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void getSent_empty() {
            // given
            when(recommendationFinder.findSent(PROFILE_A_ID)).thenReturn(List.of());

            // when
            List<RecommendationDetail> result = recommendationService.getSent(PROFILE_A_ID);

            // then
            assertThat(result).isEmpty();
            verify(recommendationFinder).findSent(PROFILE_A_ID);
            verify(profileFinder, never()).findByIds(any());
            verify(memberFinder, never()).findByIds(any());
        }
    }

    @Nested
    @DisplayName("RecommendationService.getMyReceived")
    class GetMyReceivedTests {

        @Test
        @DisplayName("조회 성공")
        void getMyReceived_success() {
            // given -- B가 본인이 받은 추천서 조회 (visible 무관)
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, USER_B_ID);
            Recommendation recommendation = RecommendationFactory.create(RECOMMENDATION_ID, PROFILE_A_ID, PROFILE_B_ID);
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, MEMBER_A_ID);
            Member memberA = MemberFactory.create(MEMBER_A_ID);

            when(profileFinder.findByMemberId(USER_B_ID)).thenReturn(profileB);
            when(recommendationFinder.findMyReceived(PROFILE_B_ID)).thenReturn(List.of(recommendation));
            when(profileFinder.findByIds(List.of(PROFILE_A_ID))).thenReturn(List.of(profileA));
            when(memberFinder.findByIds(List.of(MEMBER_A_ID))).thenReturn(List.of(memberA));

            // when
            List<RecommendationDetail> result = recommendationService.getMyReceived(USER_B);

            // then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).id()).isEqualTo(RECOMMENDATION_ID);
            assertThat(result.get(0).member()).isEqualTo(memberA);
            assertThat(result.get(0).profile()).isEqualTo(profileA);
            verify(profileFinder).findByMemberId(USER_B_ID);
            verify(recommendationFinder).findMyReceived(PROFILE_B_ID);
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void getMyReceived_empty() {
            // given
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, USER_B_ID);

            when(profileFinder.findByMemberId(USER_B_ID)).thenReturn(profileB);
            when(recommendationFinder.findMyReceived(PROFILE_B_ID)).thenReturn(List.of());

            // when
            List<RecommendationDetail> result = recommendationService.getMyReceived(USER_B);

            // then
            assertThat(result).isEmpty();
            verify(recommendationFinder).findMyReceived(PROFILE_B_ID);
        }
    }

    @Nested
    @DisplayName("RecommendationService.getMySent")
    class GetMySentTests {

        @Test
        @DisplayName("조회 성공")
        void getMySent_success() {
            // given -- A가 본인이 보낸 추천서 조회
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, USER_A_ID);
            Recommendation recommendation = RecommendationFactory.create(RECOMMENDATION_ID, PROFILE_A_ID, PROFILE_B_ID);
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, MEMBER_B_ID);
            Member memberB = MemberFactory.create(MEMBER_B_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(recommendationFinder.findMySent(PROFILE_A_ID)).thenReturn(List.of(recommendation));
            when(profileFinder.findByIds(List.of(PROFILE_B_ID))).thenReturn(List.of(profileB));
            when(memberFinder.findByIds(List.of(MEMBER_B_ID))).thenReturn(List.of(memberB));

            // when
            List<RecommendationDetail> result = recommendationService.getMySent(USER_A);

            // then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).id()).isEqualTo(RECOMMENDATION_ID);
            assertThat(result.get(0).member()).isEqualTo(memberB);
            assertThat(result.get(0).profile()).isEqualTo(profileB);
            verify(profileFinder).findByMemberId(USER_A_ID);
            verify(recommendationFinder).findMySent(PROFILE_A_ID);
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void getMySent_empty() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, USER_A_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(recommendationFinder.findMySent(PROFILE_A_ID)).thenReturn(List.of());

            // when
            List<RecommendationDetail> result = recommendationService.getMySent(USER_A);

            // then
            assertThat(result).isEmpty();
            verify(recommendationFinder).findMySent(PROFILE_A_ID);
        }
    }
}
