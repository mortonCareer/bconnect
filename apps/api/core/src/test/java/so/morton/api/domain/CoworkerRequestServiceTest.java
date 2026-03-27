package so.morton.api.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import so.morton.api.domain.coworker.CoworkerExceptionCode;
import so.morton.api.domain.coworker.CoworkerRequest;
import so.morton.api.domain.coworker.CoworkerRequestService;
import so.morton.api.domain.profile.Profile;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.storage.domain.coworker.CoworkerEntity;
import so.morton.api.storage.domain.coworker.CoworkerRepository;
import so.morton.api.storage.domain.coworker.CoworkerRequestEntity;
import so.morton.api.storage.domain.coworker.CoworkerRequestRepository;
import so.morton.api.storage.value.Role;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.auth.User;
import so.morton.api.support.fixture.CoworkerRequestFactory;
import so.morton.api.support.fixture.ProfileFactory;
import so.morton.api.support.fixture.UserFactory;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static so.morton.api.support.CodeExceptionAssert.assertCodeException;

@ExtendWith(MockitoExtension.class)
@DisplayName("CoworkerRequestService 테스트")
class CoworkerRequestServiceTest {

    @Mock private CoworkerRepository coworkerRepository;
    @Mock private CoworkerRequestRepository requestRepository;
    @Mock private ProfileFinder profileFinder;
    @InjectMocks private CoworkerRequestService coworkerRequestService;

    private static final Long USER_A_ID = 1L;
    private static final Long USER_B_ID = 2L;
    private static final Long PROFILE_A_ID = 1L;
    private static final Long PROFILE_B_ID = 2L;
    private static final Long REQUEST_ID = 1L;
    private static final Long REVERSE_REQUEST_ID = 2L;
    private static final User USER_A = UserFactory.create(USER_A_ID, Role.FOREMAN);
    private static final User USER_B = UserFactory.create(USER_B_ID, Role.FOREMAN);

    @Nested
    @DisplayName("CoworkerRequestService.create")
    class CreateTests {

        @Test
        @DisplayName("생성 성공")
        void create_success() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, USER_A_ID);
            CoworkerRequestEntity savedEntity = CoworkerRequestFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(savedEntity, "id", REQUEST_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(profileFinder.existsById(PROFILE_B_ID)).thenReturn(true);
            when(coworkerRepository.existsByMinIdAndMaxId(PROFILE_A_ID, PROFILE_B_ID)).thenReturn(false);
            when(requestRepository.findByFromIdAndToId(PROFILE_A_ID, PROFILE_B_ID)).thenReturn(Optional.empty());
            when(requestRepository.findByFromIdAndToId(PROFILE_B_ID, PROFILE_A_ID)).thenReturn(Optional.empty());
            when(requestRepository.save(any(CoworkerRequestEntity.class))).thenReturn(savedEntity);

            // when
            CoworkerRequest result = coworkerRequestService.create(USER_A, PROFILE_B_ID);

            // then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(REQUEST_ID);
            assertThat(result.fromId()).isEqualTo(PROFILE_A_ID);
            assertThat(result.toId()).isEqualTo(PROFILE_B_ID);
            verify(requestRepository).save(any(CoworkerRequestEntity.class));
            verify(coworkerRepository, never()).save(any());
        }

        @Test
        @DisplayName("자기 요청 시 SELF_REQUEST")
        void create_selfRequest() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, USER_A_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);

            // when & then
            assertCodeException(() -> coworkerRequestService.create(USER_A, PROFILE_A_ID))
                    .hasExceptionCode(CoworkerExceptionCode.SELF_REQUEST);
            verify(requestRepository, never()).save(any());
        }

        @Test
        @DisplayName("대상 미존재 시 TARGET_NOT_FOUND")
        void create_targetNotFound() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, USER_A_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(profileFinder.existsById(PROFILE_B_ID)).thenReturn(false);

            // when & then
            assertCodeException(() -> coworkerRequestService.create(USER_A, PROFILE_B_ID))
                    .hasExceptionCode(CoworkerExceptionCode.TARGET_NOT_FOUND);
            verify(requestRepository, never()).save(any());
        }

        @Test
        @DisplayName("이미 동료 시 ALREADY_COWORKER")
        void create_alreadyCoworker() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, USER_A_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(profileFinder.existsById(PROFILE_B_ID)).thenReturn(true);
            when(coworkerRepository.existsByMinIdAndMaxId(PROFILE_A_ID, PROFILE_B_ID)).thenReturn(true);

            // when & then
            assertCodeException(() -> coworkerRequestService.create(USER_A, PROFILE_B_ID))
                    .hasExceptionCode(CoworkerExceptionCode.ALREADY_COWORKER);
            verify(requestRepository, never()).save(any());
        }

        @Test
        @DisplayName("이미 요청 시 ALREADY_REQUESTED")
        void create_alreadyRequested() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, USER_A_ID);
            CoworkerRequestEntity existingRequest = CoworkerRequestFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(existingRequest, "id", REQUEST_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(profileFinder.existsById(PROFILE_B_ID)).thenReturn(true);
            when(coworkerRepository.existsByMinIdAndMaxId(PROFILE_A_ID, PROFILE_B_ID)).thenReturn(false);
            when(requestRepository.findByFromIdAndToId(PROFILE_A_ID, PROFILE_B_ID)).thenReturn(Optional.of(existingRequest));

            // when & then
            assertCodeException(() -> coworkerRequestService.create(USER_A, PROFILE_B_ID))
                    .hasExceptionCode(CoworkerExceptionCode.ALREADY_REQUESTED);
            verify(requestRepository, never()).save(any());
        }

        @Test
        @DisplayName("프로필 미존재 시 NOT_FOUND")
        void create_profileNotFound() {
            // given
            when(profileFinder.findByMemberId(USER_A_ID))
                    .thenThrow(new CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            assertCodeException(() -> coworkerRequestService.create(USER_A, PROFILE_B_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(requestRepository, never()).save(any());
        }

        @Test
        @DisplayName("역방향 요청 존재 시 자동 수락")
        void create_autoAccept_reverseExists() {
            // given -- B->A 요청이 이미 존재하고, A가 A->B 요청을 생성
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, USER_A_ID);
            CoworkerRequestEntity reverseRequest = CoworkerRequestFactory.createEntity(PROFILE_B_ID, PROFILE_A_ID);
            ReflectionTestUtils.setField(reverseRequest, "id", REVERSE_REQUEST_ID);
            CoworkerRequestEntity savedEntity = CoworkerRequestFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(savedEntity, "id", REQUEST_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(profileFinder.existsById(PROFILE_B_ID)).thenReturn(true);
            when(coworkerRepository.existsByMinIdAndMaxId(PROFILE_A_ID, PROFILE_B_ID)).thenReturn(false);
            when(requestRepository.findByFromIdAndToId(PROFILE_A_ID, PROFILE_B_ID)).thenReturn(Optional.empty());
            when(requestRepository.findByFromIdAndToId(PROFILE_B_ID, PROFILE_A_ID)).thenReturn(Optional.of(reverseRequest));
            when(requestRepository.findById(REVERSE_REQUEST_ID)).thenReturn(Optional.of(reverseRequest));
            when(requestRepository.save(any(CoworkerRequestEntity.class))).thenReturn(savedEntity);

            // when
            coworkerRequestService.create(USER_A, PROFILE_B_ID);

            // then -- 자동 수락: Coworker 관계 생성 + 기존 B->A 요청 삭제
            verify(coworkerRepository).save(any(CoworkerEntity.class));
            verify(requestRepository).delete(reverseRequest);
        }

        @Test
        @DisplayName("자동 수락 후 불필요한 요청 저장 (버그)")
        void create_autoAccept_alsoSavesNewRequest() {
            // given -- B->A 요청이 이미 존재하고, A가 A->B 요청을 생성
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, USER_A_ID);
            CoworkerRequestEntity reverseRequest = CoworkerRequestFactory.createEntity(PROFILE_B_ID, PROFILE_A_ID);
            ReflectionTestUtils.setField(reverseRequest, "id", REVERSE_REQUEST_ID);
            CoworkerRequestEntity savedEntity = CoworkerRequestFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(savedEntity, "id", REQUEST_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(profileFinder.existsById(PROFILE_B_ID)).thenReturn(true);
            when(coworkerRepository.existsByMinIdAndMaxId(PROFILE_A_ID, PROFILE_B_ID)).thenReturn(false);
            when(requestRepository.findByFromIdAndToId(PROFILE_A_ID, PROFILE_B_ID)).thenReturn(Optional.empty());
            when(requestRepository.findByFromIdAndToId(PROFILE_B_ID, PROFILE_A_ID)).thenReturn(Optional.of(reverseRequest));
            when(requestRepository.findById(REVERSE_REQUEST_ID)).thenReturn(Optional.of(reverseRequest));
            when(requestRepository.save(any(CoworkerRequestEntity.class))).thenReturn(savedEntity);

            // when
            CoworkerRequest result = coworkerRequestService.create(USER_A, PROFILE_B_ID);

            // then -- 버그: 자동 수락 후에도 새 A->B CoworkerRequest가 저장됨 (불필요한 save)
            // 자동 수락이 발생했으므로 Coworker 관계만 생성되어야 하지만,
            // create 메서드의 마지막에서 requestRepository.save()가 호출된다.
            verify(requestRepository).save(any(CoworkerRequestEntity.class));
            assertThat(result).isNotNull();
            assertThat(result.fromId()).isEqualTo(PROFILE_A_ID);
            assertThat(result.toId()).isEqualTo(PROFILE_B_ID);
        }
    }

    @Nested
    @DisplayName("CoworkerRequestService.accept")
    class AcceptTests {

        @Test
        @DisplayName("수락 성공")
        void accept_success() {
            // given
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, USER_B_ID);
            CoworkerRequestEntity request = CoworkerRequestFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(request, "id", REQUEST_ID);

            when(profileFinder.findByMemberId(USER_B_ID)).thenReturn(profileB);
            when(requestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));

            // when
            coworkerRequestService.accept(USER_B, REQUEST_ID);

            // then
            verify(requestRepository).delete(request);
            verify(coworkerRepository).save(any(CoworkerEntity.class));
        }

        @Test
        @DisplayName("미존재 시 REQUEST_NOT_FOUND")
        void accept_notFound() {
            // given
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, USER_B_ID);

            when(profileFinder.findByMemberId(USER_B_ID)).thenReturn(profileB);
            when(requestRepository.findById(REQUEST_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> coworkerRequestService.accept(USER_B, REQUEST_ID))
                    .hasExceptionCode(CoworkerExceptionCode.REQUEST_NOT_FOUND);
            verify(coworkerRepository, never()).save(any());
        }

        @Test
        @DisplayName("발신자 수락 시 FORBIDDEN")
        void accept_forbidden() {
            // given -- A가 보낸 요청을 A 본인이 수락 시도 (toId != profileA.id)
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, USER_A_ID);
            CoworkerRequestEntity request = CoworkerRequestFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(request, "id", REQUEST_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(requestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));

            // when & then
            assertCodeException(() -> coworkerRequestService.accept(USER_A, REQUEST_ID))
                    .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
            verify(coworkerRepository, never()).save(any());
            verify(requestRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("CoworkerRequestService.deny")
    class DenyTests {

        @Test
        @DisplayName("거절 성공")
        void deny_success() {
            // given
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, USER_B_ID);
            CoworkerRequestEntity request = CoworkerRequestFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(request, "id", REQUEST_ID);

            when(profileFinder.findByMemberId(USER_B_ID)).thenReturn(profileB);
            when(requestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));

            // when
            coworkerRequestService.deny(USER_B, REQUEST_ID);

            // then
            verify(requestRepository).delete(request);
        }

        @Test
        @DisplayName("미존재 시 REQUEST_NOT_FOUND")
        void deny_notFound() {
            // given
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, USER_B_ID);

            when(profileFinder.findByMemberId(USER_B_ID)).thenReturn(profileB);
            when(requestRepository.findById(REQUEST_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> coworkerRequestService.deny(USER_B, REQUEST_ID))
                    .hasExceptionCode(CoworkerExceptionCode.REQUEST_NOT_FOUND);
            verify(requestRepository, never()).delete(any());
        }

        @Test
        @DisplayName("발신자 거절 시 FORBIDDEN")
        void deny_forbidden() {
            // given -- A가 보낸 요청을 A 본인이 거절 시도 (toId != profileA.id)
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, USER_A_ID);
            CoworkerRequestEntity request = CoworkerRequestFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(request, "id", REQUEST_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(requestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));

            // when & then
            assertCodeException(() -> coworkerRequestService.deny(USER_A, REQUEST_ID))
                    .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
            verify(requestRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("CoworkerRequestService.cancel")
    class CancelTests {

        @Test
        @DisplayName("취소 성공")
        void cancel_success() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, USER_A_ID);
            CoworkerRequestEntity request = CoworkerRequestFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(request, "id", REQUEST_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(requestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));

            // when
            coworkerRequestService.cancel(USER_A, REQUEST_ID);

            // then
            verify(requestRepository).delete(request);
        }

        @Test
        @DisplayName("미존재 시 REQUEST_NOT_FOUND")
        void cancel_notFound() {
            // given
            Profile profileA = ProfileFactory.create(PROFILE_A_ID, USER_A_ID);

            when(profileFinder.findByMemberId(USER_A_ID)).thenReturn(profileA);
            when(requestRepository.findById(REQUEST_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> coworkerRequestService.cancel(USER_A, REQUEST_ID))
                    .hasExceptionCode(CoworkerExceptionCode.REQUEST_NOT_FOUND);
            verify(requestRepository, never()).delete(any());
        }

        @Test
        @DisplayName("수신자 취소 시 FORBIDDEN")
        void cancel_forbidden() {
            // given -- A가 보낸 요청을 B가 취소 시도 (fromId != profileB.id)
            Profile profileB = ProfileFactory.create(PROFILE_B_ID, USER_B_ID);
            CoworkerRequestEntity request = CoworkerRequestFactory.createEntity(PROFILE_A_ID, PROFILE_B_ID);
            ReflectionTestUtils.setField(request, "id", REQUEST_ID);

            when(profileFinder.findByMemberId(USER_B_ID)).thenReturn(profileB);
            when(requestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));

            // when & then
            assertCodeException(() -> coworkerRequestService.cancel(USER_B, REQUEST_ID))
                    .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
            verify(requestRepository, never()).delete(any());
        }
    }
}
