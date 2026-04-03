package so.morton.api.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import so.morton.api.domain.coworker.*;
import so.morton.api.domain.profile.Profile;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.storage.domain.coworker.CoworkerEntity;
import so.morton.api.storage.domain.coworker.CoworkerRepository;
import so.morton.api.storage.domain.coworker.CoworkerRequestEntity;
import so.morton.api.storage.domain.coworker.CoworkerRequestRepository;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.fixture.*;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static so.morton.api.support.CodeExceptionAssert.assertCodeException;

@ExtendWith(MockitoExtension.class)
@DisplayName("CoworkerService 테스트")
class CoworkerServiceTest {

    @Mock private CoworkerRepository coworkerRepository;
    @Mock private CoworkerFinder coworkerFinder;
    @Mock private ProfileFinder profileFinder;
    @InjectMocks private CoworkerService coworkerService;

    private static final Long USER_ID = UserFactory.FOREMAN_USER.id();
    private static final Long PROFILE_ID = 1L;
    private static final Long TARGET_PROFILE_ID = 2L;
    private static final Long OTHER_PROFILE_ID = 3L;
    private static final Long COWORKER_ID = 4L;

    @Nested
    @DisplayName("CoworkerService.getAll")
    class GetAllTests {

        @Test
        @DisplayName("본인 프로필 조회 성공")
        void getAll_ownProfile() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            List<Coworker> expectedCoworkers = List.of(
                    new Coworker(COWORKER_ID, PROFILE_ID, TARGET_PROFILE_ID)
            );

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(coworkerFinder.find(PROFILE_ID)).thenReturn(expectedCoworkers);

            // when
            List<Coworker> result = coworkerService.getAll(UserFactory.FOREMAN_USER, PROFILE_ID);

            // then
            assertThat(result).isEqualTo(expectedCoworkers);
            assertThat(result).hasSize(1);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(coworkerFinder).find(PROFILE_ID);
            verify(coworkerFinder, never()).isCoworker(anyLong(), anyLong());
        }

        @Test
        @DisplayName("동료 프로필 조회 성공")
        void getAll_coworkerProfile() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            List<Coworker> expectedCoworkers = List.of(
                    new Coworker(COWORKER_ID, PROFILE_ID, TARGET_PROFILE_ID)
            );

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(coworkerFinder.isCoworker(PROFILE_ID, TARGET_PROFILE_ID)).thenReturn(true);
            when(coworkerFinder.find(TARGET_PROFILE_ID)).thenReturn(expectedCoworkers);

            // when
            List<Coworker> result = coworkerService.getAll(UserFactory.FOREMAN_USER, TARGET_PROFILE_ID);

            // then
            assertThat(result).isEqualTo(expectedCoworkers);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(coworkerFinder).isCoworker(PROFILE_ID, TARGET_PROFILE_ID);
            verify(coworkerFinder).find(TARGET_PROFILE_ID);
        }

        @Test
        @DisplayName("비동료 조회 시 FORBIDDEN")
        void getAll_notCoworker() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(coworkerFinder.isCoworker(PROFILE_ID, OTHER_PROFILE_ID)).thenReturn(false);

            // when & then
            assertCodeException(() -> coworkerService.getAll(UserFactory.FOREMAN_USER, OTHER_PROFILE_ID))
                    .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(coworkerFinder).isCoworker(PROFILE_ID, OTHER_PROFILE_ID);
            verify(coworkerFinder, never()).find(any());
        }

        @Test
        @DisplayName("프로필 미존재 시 NOT_FOUND")
        void getAll_profileNotFound() {
            // given
            when(profileFinder.findByMemberId(USER_ID))
                    .thenThrow(new CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            assertCodeException(() -> coworkerService.getAll(UserFactory.FOREMAN_USER, TARGET_PROFILE_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(coworkerFinder, never()).find(any());
            verify(coworkerFinder, never()).isCoworker(anyLong(), anyLong());
        }
    }

    @Nested
    @DisplayName("CoworkerService.delete")
    class DeleteTests {

        @Test
        @DisplayName("삭제 성공")
        void delete_success() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            CoworkerEntity entity = CoworkerFactory.createEntity(PROFILE_ID, TARGET_PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", COWORKER_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(coworkerRepository.findById(COWORKER_ID)).thenReturn(Optional.of(entity));

            // when
            coworkerService.delete(UserFactory.FOREMAN_USER, COWORKER_ID);

            // then
            verify(profileFinder).findByMemberId(USER_ID);
            verify(coworkerRepository).findById(COWORKER_ID);
            verify(coworkerRepository).delete(entity);
        }

        @Test
        @DisplayName("minId 측 삭제 성공")
        void delete_asMinId() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            CoworkerEntity entity = CoworkerFactory.createEntity(PROFILE_ID, TARGET_PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", COWORKER_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(coworkerRepository.findById(COWORKER_ID)).thenReturn(Optional.of(entity));

            // when
            coworkerService.delete(UserFactory.FOREMAN_USER, COWORKER_ID);

            // then
            assertThat(entity.getMinId()).isEqualTo(PROFILE_ID);
            verify(coworkerRepository).delete(entity);
        }

        @Test
        @DisplayName("maxId 측 삭제 성공")
        void delete_asMaxId() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            CoworkerEntity entity = CoworkerFactory.createEntity(5L, PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", COWORKER_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(coworkerRepository.findById(COWORKER_ID)).thenReturn(Optional.of(entity));

            // when
            coworkerService.delete(UserFactory.FOREMAN_USER, COWORKER_ID);

            // then
            assertThat(entity.getMaxId()).isEqualTo(PROFILE_ID);
            verify(coworkerRepository).delete(entity);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void delete_notFound() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(coworkerRepository.findById(COWORKER_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> coworkerService.delete(UserFactory.FOREMAN_USER, COWORKER_ID))
                    .hasExceptionCode(CoworkerExceptionCode.NOT_FOUND);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(coworkerRepository).findById(COWORKER_ID);
            verify(coworkerRepository, never()).delete(any());
        }

        @Test
        @DisplayName("비참여자 삭제 시 FORBIDDEN")
        void delete_forbidden() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            CoworkerEntity entity = CoworkerFactory.createEntity(TARGET_PROFILE_ID, OTHER_PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", COWORKER_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(coworkerRepository.findById(COWORKER_ID)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> coworkerService.delete(UserFactory.FOREMAN_USER, COWORKER_ID))
                    .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(coworkerRepository).findById(COWORKER_ID);
            verify(coworkerRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("CoworkerFinder.find")
    class CoworkerFinderFindTests {

        @Mock
        private CoworkerRepository finderCoworkerRepository;

        @Mock
        private CoworkerRequestRepository finderRequestRepository;

        @InjectMocks
        private CoworkerFinder finderUnderTest;

        @Test
        @DisplayName("조회 성공")
        void find_success() {
            // given
            CoworkerEntity entity1 = CoworkerFactory.createEntity(PROFILE_ID, TARGET_PROFILE_ID);
            ReflectionTestUtils.setField(entity1, "id", COWORKER_ID);
            CoworkerEntity entity2 = CoworkerFactory.createEntity(PROFILE_ID, OTHER_PROFILE_ID);
            ReflectionTestUtils.setField(entity2, "id", 101L);

            when(finderCoworkerRepository.findByProfileId(PROFILE_ID))
                    .thenReturn(List.of(entity1, entity2));

            // when
            List<Coworker> result = finderUnderTest.find(PROFILE_ID);

            // then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).id()).isEqualTo(COWORKER_ID);
            assertThat(result.get(1).id()).isEqualTo(101L);
            verify(finderCoworkerRepository).findByProfileId(PROFILE_ID);
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void find_empty() {
            // given
            when(finderCoworkerRepository.findByProfileId(PROFILE_ID))
                    .thenReturn(List.of());

            // when
            List<Coworker> result = finderUnderTest.find(PROFILE_ID);

            // then
            assertThat(result).isEmpty();
            verify(finderCoworkerRepository).findByProfileId(PROFILE_ID);
        }
    }

    @Nested
    @DisplayName("CoworkerFinder.findRequests")
    class CoworkerFinderFindRequestsTests {

        @Mock
        private CoworkerRepository finderCoworkerRepository;

        @Mock
        private CoworkerRequestRepository finderRequestRepository;

        @InjectMocks
        private CoworkerFinder finderUnderTest;

        @Test
        @DisplayName("조회 성공")
        void findRequests_success() {
            // given
            CoworkerRequestEntity entity1 = CoworkerRequestFactory.createEntity(TARGET_PROFILE_ID, PROFILE_ID);
            ReflectionTestUtils.setField(entity1, "id", 2L);
            CoworkerRequestEntity entity2 = CoworkerRequestFactory.createEntity(OTHER_PROFILE_ID, PROFILE_ID);
            ReflectionTestUtils.setField(entity2, "id", 201L);

            when(finderRequestRepository.findByProfileId(PROFILE_ID))
                    .thenReturn(List.of(entity1, entity2));

            // when
            List<CoworkerRequest> result = finderUnderTest.findRequests(PROFILE_ID);

            // then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).id()).isEqualTo(2L);
            assertThat(result.get(1).id()).isEqualTo(201L);
            verify(finderRequestRepository).findByProfileId(PROFILE_ID);
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void findRequests_empty() {
            // given
            when(finderRequestRepository.findByProfileId(PROFILE_ID))
                    .thenReturn(List.of());

            // when
            List<CoworkerRequest> result = finderUnderTest.findRequests(PROFILE_ID);

            // then
            assertThat(result).isEmpty();
            verify(finderRequestRepository).findByProfileId(PROFILE_ID);
        }
    }

    @Nested
    @DisplayName("CoworkerFinder.isCoworker")
    class CoworkerFinderIsCoworkerTests {

        @Mock
        private CoworkerRepository finderCoworkerRepository;

        @Mock
        private CoworkerRequestRepository finderRequestRepository;

        @InjectMocks
        private CoworkerFinder finderUnderTest;

        @Test
        @DisplayName("동료 시 true")
        void isCoworker_true() {
            // given — Math.min(1, 2) = 1, Math.max(1, 2) = 2
            when(finderCoworkerRepository.existsByMinIdAndMaxId(PROFILE_ID, TARGET_PROFILE_ID))
                    .thenReturn(true);

            // when
            boolean result = finderUnderTest.isCoworker(PROFILE_ID, TARGET_PROFILE_ID);

            // then
            assertThat(result).isTrue();
            verify(finderCoworkerRepository).existsByMinIdAndMaxId(PROFILE_ID, TARGET_PROFILE_ID);
        }

        @Test
        @DisplayName("비동료 시 false")
        void isCoworker_false() {
            // given — Math.min(1, 3) = 1, Math.max(1, 3) = 3
            when(finderCoworkerRepository.existsByMinIdAndMaxId(PROFILE_ID, OTHER_PROFILE_ID))
                    .thenReturn(false);

            // when
            boolean result = finderUnderTest.isCoworker(PROFILE_ID, OTHER_PROFILE_ID);

            // then
            assertThat(result).isFalse();
            verify(finderCoworkerRepository).existsByMinIdAndMaxId(PROFILE_ID, OTHER_PROFILE_ID);
        }
    }
}
