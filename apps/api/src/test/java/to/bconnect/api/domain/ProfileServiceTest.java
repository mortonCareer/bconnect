package to.bconnect.api.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.test.util.ReflectionTestUtils;
import to.bconnect.api.api.controller.v1.request.CreateProfileRequest;
import to.bconnect.api.api.controller.v1.request.UpdateProfileRequest;
import to.bconnect.api.domain.profile.Profile;
import to.bconnect.api.domain.profile.ProfileExceptionCode;
import to.bconnect.api.domain.profile.ProfileFinder;
import to.bconnect.api.domain.profile.ProfileService;
import to.bconnect.api.storage.domain.profile.ProfileEntity;
import to.bconnect.api.storage.domain.profile.ProfileRepository;
import to.bconnect.api.storage.common.value.Trade;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.support.UnitTest;
import to.bconnect.api.support.fixture.ProfileFactory;
import to.bconnect.api.support.fixture.UserFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@UnitTest
@DisplayName("ProfileService 테스트")
class ProfileServiceTest {

    @Mock private ProfileRepository profileRepository;
    @Mock private ProfileFinder profileFinder;
    @InjectMocks private ProfileService profileService;

    private static final Long USER_ID = UserFactory.FOREMAN_USER.id();
    private static final Long PROFILE_ID = 1L;

    private void stubSaveToSetEntityFields() {
        when(profileRepository.save(any(ProfileEntity.class))).thenAnswer(invocation -> {
            ProfileEntity entity = invocation.getArgument(0);
            ReflectionTestUtils.setField(entity, "id", PROFILE_ID);
            ReflectionTestUtils.setField(entity, "createdAt", LocalDateTime.now());
            ReflectionTestUtils.setField(entity, "modifiedAt", LocalDateTime.now());
            return entity;
        });
    }

    // ========================================================================
    // ProfileService.create
    // ========================================================================

    @Nested
    @DisplayName("ProfileService.create")
    class CreateTests {

        @Test
        @DisplayName("생성 성공")
        void create_success() {
            // given
            CreateProfileRequest request = ProfileFactory.createRequest();

            when(profileFinder.existsByMemberId(USER_ID)).thenReturn(false);
            stubSaveToSetEntityFields();

            // when
            Profile result = profileService.create(UserFactory.FOREMAN_USER, request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(PROFILE_ID);
            assertThat(result.memberId()).isEqualTo(USER_ID);
            assertThat(result.primaryTrade()).isEqualTo(Trade.ELECTRICAL);
            assertThat(result.trades()).containsExactlyInAnyOrder(Trade.ELECTRICAL);
            assertThat(result.experience()).isEqualTo(5);
            assertThat(result.headline()).isEqualTo("headline");
            assertThat(result.about()).isEqualTo("about");
            verify(profileFinder).existsByMemberId(USER_ID);
            verify(profileRepository).save(any(ProfileEntity.class));
        }

        @Test
        @DisplayName("중복 시 ALREADY_EXISTS")
        void create_alreadyExists() {
            // given
            CreateProfileRequest request = ProfileFactory.createRequest();

            when(profileFinder.existsByMemberId(USER_ID)).thenReturn(true);

            // when & then
            assertCodeException(() -> profileService.create(UserFactory.FOREMAN_USER, request))
                    .hasExceptionCode(ProfileExceptionCode.ALREADY_EXISTS);
            verify(profileFinder).existsByMemberId(USER_ID);
            verify(profileRepository, never()).save(any());
        }

        @Test
        @DisplayName("주 직종 미포함 시 INVALID_PRIMARY_TRADE")
        void create_primaryTradeNotInTrades() {
            // given
            CreateProfileRequest request = new CreateProfileRequest(
                    Trade.ELECTRICAL,
                    Set.of(Trade.PLUMBING),
                    5,
                    "headline",
                    "about",
                    ProfileFactory.ADDRESS
            );

            when(profileFinder.existsByMemberId(USER_ID)).thenReturn(false);

            // when & then
            assertCodeException(() -> profileService.create(UserFactory.FOREMAN_USER, request))
                    .hasExceptionCode(ProfileExceptionCode.INVALID_PRIMARY_TRADE);
        }

        @Test
        @DisplayName("음수 experience 허용 (검증 부재)")
        void create_negativeExperience() {
            // given
            CreateProfileRequest request = new CreateProfileRequest(
                    Trade.ELECTRICAL,
                    Set.of(Trade.ELECTRICAL),
                    -1,
                    "headline",
                    "about",
                    ProfileFactory.ADDRESS
            );

            when(profileFinder.existsByMemberId(USER_ID)).thenReturn(false);
            stubSaveToSetEntityFields();

            // when & then
            assertThatCode(() -> profileService.create(UserFactory.FOREMAN_USER, request))
                    .doesNotThrowAnyException();
            verify(profileRepository).save(any(ProfileEntity.class));
        }

        @Test
        @DisplayName("experience 0 생성 성공")
        void create_zeroExperience() {
            // given
            CreateProfileRequest request = new CreateProfileRequest(
                    Trade.ELECTRICAL,
                    Set.of(Trade.ELECTRICAL),
                    0,
                    "headline",
                    "about",
                    ProfileFactory.ADDRESS
            );

            when(profileFinder.existsByMemberId(USER_ID)).thenReturn(false);
            stubSaveToSetEntityFields();

            // when
            Profile result = profileService.create(UserFactory.FOREMAN_USER, request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.experience()).isEqualTo(0);
            verify(profileRepository).save(any(ProfileEntity.class));
        }

        @Test
        @DisplayName("experience MAX_VALUE 생성 성공")
        void create_maxExperience() {
            // given
            CreateProfileRequest request = new CreateProfileRequest(
                    Trade.ELECTRICAL,
                    Set.of(Trade.ELECTRICAL),
                    Integer.MAX_VALUE,
                    "headline",
                    "about",
                    ProfileFactory.ADDRESS
            );

            when(profileFinder.existsByMemberId(USER_ID)).thenReturn(false);
            stubSaveToSetEntityFields();

            // when
            Profile result = profileService.create(UserFactory.FOREMAN_USER, request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.experience()).isEqualTo(Integer.MAX_VALUE);
            verify(profileRepository).save(any(ProfileEntity.class));
        }
    }

    // ========================================================================
    // ProfileService.update
    // ========================================================================

    @Nested
    @DisplayName("ProfileService.update")
    class UpdateTests {

        @Test
        @DisplayName("수정 성공")
        void update_success() {
            // given
            UpdateProfileRequest request = ProfileFactory.updateRequest();
            ProfileEntity entity = ProfileFactory.createEntity(USER_ID);
            ReflectionTestUtils.setField(entity, "id", PROFILE_ID);

            when(profileRepository.findByMemberId(USER_ID)).thenReturn(Optional.of(entity));

            // when
            profileService.update(UserFactory.FOREMAN_USER, request);

            // then
            assertThat(entity.getPrimaryTrade()).isEqualTo(Trade.ELECTRICAL);
            assertThat(entity.getTrades()).containsExactlyInAnyOrder(Trade.ELECTRICAL, Trade.PLUMBING);
            assertThat(entity.getExperience()).isEqualTo(10);
            assertThat(entity.getHeadline()).isEqualTo("Updated Headline");
            verify(profileRepository).findByMemberId(USER_ID);
        }

        @Test
        @DisplayName("프로필 미존재 시 NOT_FOUND")
        void update_profileNotFound() {
            // given
            UpdateProfileRequest request = ProfileFactory.updateRequest();

            when(profileRepository.findByMemberId(USER_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> profileService.update(UserFactory.FOREMAN_USER, request))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(profileRepository).findByMemberId(USER_ID);
        }
    }

    // ========================================================================
    // ProfileService.updateAbout
    // ========================================================================

    @Nested
    @DisplayName("ProfileService.updateAbout")
    class UpdateAboutTests {

        @Test
        @DisplayName("수정 성공")
        void updateAbout_success() {
            // given
            ProfileEntity entity = ProfileFactory.createEntity(USER_ID);
            ReflectionTestUtils.setField(entity, "id", PROFILE_ID);

            when(profileRepository.findByMemberId(USER_ID)).thenReturn(Optional.of(entity));

            // when
            profileService.updateAbout(UserFactory.FOREMAN_USER, "Updated About");

            // then
            assertThat(entity.getAbout()).isEqualTo("Updated About");
            verify(profileRepository).findByMemberId(USER_ID);
        }

        @Test
        @DisplayName("프로필 미존재 시 NOT_FOUND")
        void updateAbout_profileNotFound() {
            // given
            when(profileRepository.findByMemberId(USER_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> profileService.updateAbout(UserFactory.FOREMAN_USER, "About"))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(profileRepository).findByMemberId(USER_ID);
        }

        @Test
        @DisplayName("null about 수정 성공")
        void updateAbout_nullAbout() {
            // given
            ProfileEntity entity = ProfileFactory.createEntity(USER_ID);
            ReflectionTestUtils.setField(entity, "id", PROFILE_ID);

            when(profileRepository.findByMemberId(USER_ID)).thenReturn(Optional.of(entity));

            // when
            profileService.updateAbout(UserFactory.FOREMAN_USER, null);

            // then
            assertThat(entity.getAbout()).isNull();
            verify(profileRepository).findByMemberId(USER_ID);
        }
    }

    // ========================================================================
    // ProfileService.delete
    // ========================================================================

    @Nested
    @DisplayName("ProfileService.delete")
    class DeleteTests {

        @Test
        @DisplayName("삭제 성공")
        void delete_success() {
            // given
            ProfileEntity entity = ProfileFactory.createEntity(USER_ID);
            ReflectionTestUtils.setField(entity, "id", PROFILE_ID);

            when(profileRepository.findByMemberId(USER_ID)).thenReturn(Optional.of(entity));

            // when
            profileService.delete(UserFactory.FOREMAN_USER);

            // then
            verify(profileRepository).findByMemberId(USER_ID);
            verify(profileRepository).delete(entity);
        }

        @Test
        @DisplayName("프로필 미존재 시 NOT_FOUND")
        void delete_profileNotFound() {
            // given
            when(profileRepository.findByMemberId(USER_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> profileService.delete(UserFactory.FOREMAN_USER))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(profileRepository).findByMemberId(USER_ID);
            verify(profileRepository, never()).delete(any());
        }
    }

    // ========================================================================
    // ProfileFinder
    // ========================================================================

    @Nested
    @DisplayName("ProfileFinder.findAll")
    class ProfileFinderFindAllTests {

        @Mock
        private ProfileRepository finderProfileRepository;

        @InjectMocks
        private ProfileFinder profileFinder;

        @Test
        @DisplayName("조회 성공")
        void findAll_success() {
            // given
            ProfileEntity entity1 = ProfileFactory.createEntity(USER_ID);
            ReflectionTestUtils.setField(entity1, "id", PROFILE_ID);
            ProfileEntity entity2 = ProfileFactory.createEntity(2L);
            ReflectionTestUtils.setField(entity2, "id", 11L);

            when(finderProfileRepository.findAll()).thenReturn(List.of(entity1, entity2));

            // when
            List<Profile> result = profileFinder.findAll();

            // then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).id()).isEqualTo(PROFILE_ID);
            assertThat(result.get(1).id()).isEqualTo(11L);
            verify(finderProfileRepository).findAll();
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void findAll_empty() {
            // given
            when(finderProfileRepository.findAll()).thenReturn(List.of());

            // when
            List<Profile> result = profileFinder.findAll();

            // then
            assertThat(result).isEmpty();
            verify(finderProfileRepository).findAll();
        }
    }

    @Nested
    @DisplayName("ProfileFinder.find")
    class ProfileFinderFindTests {

        @Mock
        private ProfileRepository finderProfileRepository;

        @InjectMocks
        private ProfileFinder profileFinder;

        @Test
        @DisplayName("조회 성공")
        void find_success() {
            // given
            ProfileEntity entity = ProfileFactory.createEntity(USER_ID);
            ReflectionTestUtils.setField(entity, "id", PROFILE_ID);
            when(finderProfileRepository.findById(PROFILE_ID)).thenReturn(Optional.of(entity));

            // when
            Profile result = profileFinder.find(PROFILE_ID);

            // then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(PROFILE_ID);
            assertThat(result.memberId()).isEqualTo(USER_ID);
            assertThat(result.primaryTrade()).isEqualTo(Trade.ELECTRICAL);
            verify(finderProfileRepository).findById(PROFILE_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void find_notFound() {
            // given
            when(finderProfileRepository.findById(PROFILE_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> profileFinder.find(PROFILE_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(finderProfileRepository).findById(PROFILE_ID);
        }
    }

    @Nested
    @DisplayName("ProfileFinder.findByMemberId")
    class ProfileFinderFindByMemberIdTests {

        @Mock
        private ProfileRepository finderProfileRepository;

        @InjectMocks
        private ProfileFinder profileFinder;

        @Test
        @DisplayName("조회 성공")
        void findByMemberId_success() {
            // given
            ProfileEntity entity = ProfileFactory.createEntity(USER_ID);
            ReflectionTestUtils.setField(entity, "id", PROFILE_ID);
            when(finderProfileRepository.findByMemberId(USER_ID)).thenReturn(Optional.of(entity));

            // when
            Profile result = profileFinder.findByMemberId(USER_ID);

            // then
            assertThat(result).isNotNull();
            assertThat(result.memberId()).isEqualTo(USER_ID);
            verify(finderProfileRepository).findByMemberId(USER_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void findByMemberId_notFound() {
            // given
            when(finderProfileRepository.findByMemberId(USER_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> profileFinder.findByMemberId(USER_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(finderProfileRepository).findByMemberId(USER_ID);
        }
    }

    @Nested
    @DisplayName("ProfileFinder.existsById")
    class ProfileFinderExistsByIdTests {

        @Mock
        private ProfileRepository finderProfileRepository;

        @InjectMocks
        private ProfileFinder profileFinder;

        @Test
        @DisplayName("존재 시 true")
        void existsById_true() {
            // given
            ProfileEntity entity = ProfileFactory.createEntity(USER_ID);
            ReflectionTestUtils.setField(entity, "id", PROFILE_ID);
            when(finderProfileRepository.findById(PROFILE_ID)).thenReturn(Optional.of(entity));

            // when
            boolean result = profileFinder.existsById(PROFILE_ID);

            // then
            assertThat(result).isTrue();
            verify(finderProfileRepository).findById(PROFILE_ID);
        }

        @Test
        @DisplayName("미존재 시 false")
        void existsById_false() {
            // given
            when(finderProfileRepository.findById(PROFILE_ID)).thenReturn(Optional.empty());

            // when
            boolean result = profileFinder.existsById(PROFILE_ID);

            // then
            assertThat(result).isFalse();
            verify(finderProfileRepository).findById(PROFILE_ID);
        }
    }

    @Nested
    @DisplayName("ProfileFinder.existsByMemberId")
    class ProfileFinderExistsByMemberIdTests {

        @Mock
        private ProfileRepository finderProfileRepository;

        @InjectMocks
        private ProfileFinder profileFinder;

        @Test
        @DisplayName("존재 시 true")
        void existsByMemberId_true() {
            // given
            ProfileEntity entity = ProfileFactory.createEntity(USER_ID);
            ReflectionTestUtils.setField(entity, "id", PROFILE_ID);
            when(finderProfileRepository.findByMemberId(USER_ID)).thenReturn(Optional.of(entity));

            // when
            boolean result = profileFinder.existsByMemberId(USER_ID);

            // then
            assertThat(result).isTrue();
            verify(finderProfileRepository).findByMemberId(USER_ID);
        }

        @Test
        @DisplayName("미존재 시 false")
        void existsByMemberId_false() {
            // given
            when(finderProfileRepository.findByMemberId(USER_ID)).thenReturn(Optional.empty());

            // when
            boolean result = profileFinder.existsByMemberId(USER_ID);

            // then
            assertThat(result).isFalse();
            verify(finderProfileRepository).findByMemberId(USER_ID);
        }
    }
}
