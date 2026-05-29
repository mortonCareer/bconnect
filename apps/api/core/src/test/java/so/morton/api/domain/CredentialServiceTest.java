package so.morton.api.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import so.morton.api.api.controller.v1.request.CreateCredentialRequest;
import so.morton.api.domain.credential.Credential;
import so.morton.api.domain.credential.CredentialFinder;
import so.morton.api.domain.credential.CredentialService;
import so.morton.api.domain.profile.Profile;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.storage.domain.credential.CredentialEntity;
import so.morton.api.storage.domain.credential.CredentialRepository;
import so.morton.api.storage.value.CredentialStatus;
import so.morton.api.storage.value.CredentialType;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.UnitTest;
import so.morton.api.support.fixture.CredentialFactory;
import so.morton.api.support.fixture.ProfileFactory;
import so.morton.api.support.fixture.UserFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static so.morton.api.support.CodeExceptionAssert.assertCodeException;

@UnitTest
@DisplayName("CredentialService 테스트")
class CredentialServiceTest {

    @Mock private CredentialRepository credentialRepository;
    @Mock private CredentialFinder credentialFinder;
    @Mock private ProfileFinder profileFinder;
    @InjectMocks private CredentialService credentialService;

    private static final Long USER_ID = UserFactory.FOREMAN_USER.id();
    private static final Long PROFILE_ID = 1L;
    private static final Long CREDENTIAL_ID = 1L;

    @Nested
    @DisplayName("CredentialService.getAll")
    class GetAllTests {

        @Test
        @DisplayName("조회 성공")
        void getAll_success() {
            // given
            Credential cred1 = CredentialFactory.create(1L, PROFILE_ID);
            Credential cred2 = new Credential(
                    2L, PROFILE_ID, CredentialType.CONSTRUCTION_LICENSE,
                    CredentialStatus.ACCEPTED, LocalDate.now().plusDays(365),
                    LocalDateTime.now(), LocalDateTime.now()
            );
            List<Credential> expected = List.of(cred1, cred2);
            when(credentialFinder.findFilteredByProfileId(PROFILE_ID)).thenReturn(expected);

            // when
            List<Credential> result = credentialService.getAll(PROFILE_ID);

            // then
            assertThat(result).hasSize(2);
            assertThat(result).isEqualTo(expected);
            verify(credentialFinder).findFilteredByProfileId(PROFILE_ID);
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void getAll_empty() {
            // given
            when(credentialFinder.findFilteredByProfileId(PROFILE_ID)).thenReturn(List.of());

            // when
            List<Credential> result = credentialService.getAll(PROFILE_ID);

            // then
            assertThat(result).isEmpty();
            verify(credentialFinder).findFilteredByProfileId(PROFILE_ID);
        }
    }

    @Nested
    @DisplayName("CredentialService.create")
    class CreateTests {

        @Test
        @DisplayName("생성 성공")
        void create_success() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            CreateCredentialRequest request = CredentialFactory.createRequest();

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(credentialRepository.save(any(CredentialEntity.class))).thenAnswer(invocation -> {
                CredentialEntity entity = invocation.getArgument(0);
                ReflectionTestUtils.setField(entity, "id", CREDENTIAL_ID);
                ReflectionTestUtils.setField(entity, "createdAt", LocalDateTime.now());
                ReflectionTestUtils.setField(entity, "modifiedAt", LocalDateTime.now());
                return entity;
            });

            // when
            Credential result = credentialService.create(UserFactory.FOREMAN_USER, request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(CREDENTIAL_ID);
            assertThat(result.profileId()).isEqualTo(PROFILE_ID);
            assertThat(result.type()).isEqualTo(CredentialType.SOLE_PROPRIETOR);
            assertThat(result.status()).isEqualTo(CredentialStatus.PENDING);
            assertThat(result.expiredAt()).isNotNull();
            verify(profileFinder).findByMemberId(USER_ID);
            verify(credentialRepository).save(any(CredentialEntity.class));
        }

        @Test
        @DisplayName("null expiredAt 시 생성 성공")
        void create_nullExpiredAt() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            CreateCredentialRequest request = new CreateCredentialRequest(CredentialType.IDENTITY_VERIFICATION, null);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(credentialRepository.save(any(CredentialEntity.class))).thenAnswer(invocation -> {
                CredentialEntity entity = invocation.getArgument(0);
                ReflectionTestUtils.setField(entity, "id", CREDENTIAL_ID);
                ReflectionTestUtils.setField(entity, "createdAt", LocalDateTime.now());
                ReflectionTestUtils.setField(entity, "modifiedAt", LocalDateTime.now());
                return entity;
            });

            // when
            Credential result = credentialService.create(UserFactory.FOREMAN_USER, request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.type()).isEqualTo(CredentialType.IDENTITY_VERIFICATION);
            assertThat(result.expiredAt()).isNull();
            verify(credentialRepository).save(any(CredentialEntity.class));
        }

        @Test
        @DisplayName("프로필 미존재 시 NOT_FOUND")
        void create_profileNotFound() {
            // given
            CreateCredentialRequest request = CredentialFactory.createRequest();

            when(profileFinder.findByMemberId(USER_ID))
                    .thenThrow(new CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            assertCodeException(() -> credentialService.create(UserFactory.FOREMAN_USER, request))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(credentialRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("CredentialService.delete")
    class DeleteTests {

        @Test
        @DisplayName("삭제 성공")
        void delete_success() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            CredentialEntity entity = CredentialFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", CREDENTIAL_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(credentialRepository.findById(CREDENTIAL_ID)).thenReturn(Optional.of(entity));

            // when
            credentialService.delete(UserFactory.FOREMAN_USER, CREDENTIAL_ID);

            // then
            verify(profileFinder).findByMemberId(USER_ID);
            verify(credentialRepository).findById(CREDENTIAL_ID);
            verify(credentialRepository).delete(entity);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void delete_notFound() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(credentialRepository.findById(CREDENTIAL_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> credentialService.delete(UserFactory.FOREMAN_USER, CREDENTIAL_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(credentialRepository).findById(CREDENTIAL_ID);
            verify(credentialRepository, never()).delete(any());
        }

        @Test
        @DisplayName("타인 삭제 시 FORBIDDEN")
        void delete_forbidden() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            CredentialEntity entity = CredentialFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", CREDENTIAL_ID);
            ReflectionTestUtils.setField(entity, "profileId", 999L); // Different profile

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(credentialRepository.findById(CREDENTIAL_ID)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> credentialService.delete(UserFactory.FOREMAN_USER, CREDENTIAL_ID))
                    .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(credentialRepository).findById(CREDENTIAL_ID);
            verify(credentialRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("CredentialService.accept")
    class AcceptTests {

        @Test
        @DisplayName("승인 성공")
        void accept_success() {
            // given
            CredentialEntity entity = CredentialFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", CREDENTIAL_ID);
            when(credentialRepository.findById(CREDENTIAL_ID)).thenReturn(Optional.of(entity));

            // when
            credentialService.accept(CREDENTIAL_ID);

            // then
            assertThat(entity.getStatus()).isEqualTo(CredentialStatus.ACCEPTED);
            verify(credentialRepository).findById(CREDENTIAL_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void accept_notFound() {
            // given
            when(credentialRepository.findById(CREDENTIAL_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> credentialService.accept(CREDENTIAL_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(credentialRepository).findById(CREDENTIAL_ID);
        }

        @Test
        @DisplayName("이미 승인된 자격 재승인 시 상태 유지")
        void accept_alreadyAccepted() {
            // given
            CredentialEntity entity = CredentialFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", CREDENTIAL_ID);
            entity.accept();
            when(credentialRepository.findById(CREDENTIAL_ID)).thenReturn(Optional.of(entity));

            // when
            credentialService.accept(CREDENTIAL_ID);

            // then
            assertThat(entity.getStatus()).isEqualTo(CredentialStatus.ACCEPTED);
        }

        @Test
        @DisplayName("거부된 자격 승인 시 상태 변경")
        void accept_afterDenied() {
            // given
            CredentialEntity entity = CredentialFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", CREDENTIAL_ID);
            entity.deny();
            when(credentialRepository.findById(CREDENTIAL_ID)).thenReturn(Optional.of(entity));

            // when
            credentialService.accept(CREDENTIAL_ID);

            // then
            assertThat(entity.getStatus()).isEqualTo(CredentialStatus.ACCEPTED);
        }
    }

    @Nested
    @DisplayName("CredentialService.deny")
    class DenyTests {

        @Test
        @DisplayName("거부 성공")
        void deny_success() {
            // given
            CredentialEntity entity = CredentialFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", CREDENTIAL_ID);
            when(credentialRepository.findById(CREDENTIAL_ID)).thenReturn(Optional.of(entity));

            // when
            credentialService.deny(CREDENTIAL_ID);

            // then
            assertThat(entity.getStatus()).isEqualTo(CredentialStatus.DENIED);
            verify(credentialRepository).findById(CREDENTIAL_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void deny_notFound() {
            // given
            when(credentialRepository.findById(CREDENTIAL_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> credentialService.deny(CREDENTIAL_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(credentialRepository).findById(CREDENTIAL_ID);
        }

        @Test
        @DisplayName("이미 거부된 자격 재거부 시 상태 유지")
        void deny_alreadyDenied() {
            // given
            CredentialEntity entity = CredentialFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", CREDENTIAL_ID);
            entity.deny();
            when(credentialRepository.findById(CREDENTIAL_ID)).thenReturn(Optional.of(entity));

            // when
            credentialService.deny(CREDENTIAL_ID);

            // then
            assertThat(entity.getStatus()).isEqualTo(CredentialStatus.DENIED);
        }
    }

    @Nested
    @DisplayName("CredentialFinder.find")
    class FindTests {

        @Mock
        private CredentialRepository finderCredentialRepository;

        @InjectMocks
        private CredentialFinder finderCredentialFinder;

        @Test
        @DisplayName("조회 성공")
        void find_success() {
            // given
            CredentialEntity entity = CredentialFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", CREDENTIAL_ID);
            when(finderCredentialRepository.findById(CREDENTIAL_ID)).thenReturn(Optional.of(entity));

            // when
            Credential result = finderCredentialFinder.find(CREDENTIAL_ID);

            // then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(CREDENTIAL_ID);
            assertThat(result.profileId()).isEqualTo(PROFILE_ID);
            assertThat(result.type()).isEqualTo(CredentialType.SOLE_PROPRIETOR);
            verify(finderCredentialRepository).findById(CREDENTIAL_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void find_notFound() {
            // given
            when(finderCredentialRepository.findById(CREDENTIAL_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> finderCredentialFinder.find(CREDENTIAL_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(finderCredentialRepository).findById(CREDENTIAL_ID);
        }
    }

    @Nested
    @DisplayName("CredentialFinder.findByProfileId")
    class FindByProfileIdTests {

        @Mock
        private CredentialRepository finderCredentialRepository;

        @InjectMocks
        private CredentialFinder finderCredentialFinder;

        @Test
        @DisplayName("조회 성공")
        void findByProfileId_success() {
            // given
            CredentialEntity entity = CredentialFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", CREDENTIAL_ID);
            when(finderCredentialRepository.findByProfileId(PROFILE_ID)).thenReturn(List.of(entity));

            // when
            List<Credential> result = finderCredentialFinder.findByProfileId(PROFILE_ID);

            // then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).profileId()).isEqualTo(PROFILE_ID);
            assertThat(result.get(0).type()).isEqualTo(CredentialType.SOLE_PROPRIETOR);
            verify(finderCredentialRepository).findByProfileId(PROFILE_ID);
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void findByProfileId_empty() {
            // given
            when(finderCredentialRepository.findByProfileId(PROFILE_ID)).thenReturn(List.of());

            // when
            List<Credential> result = finderCredentialFinder.findByProfileId(PROFILE_ID);

            // then
            assertThat(result).isEmpty();
            verify(finderCredentialRepository).findByProfileId(PROFILE_ID);
        }
    }
}
