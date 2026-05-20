package so.morton.api.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import so.morton.api.api.controller.v1.request.RegisterMemberRequest;
import so.morton.api.api.controller.v1.request.UpdateMemberRequest;
import so.morton.api.domain.member.Member;
import so.morton.api.domain.member.MemberExceptionCode;
import so.morton.api.domain.member.MemberFinder;
import so.morton.api.domain.member.MemberService;
import so.morton.api.storage.domain.member.MemberEntity;
import so.morton.api.storage.domain.member.MemberRepository;
import so.morton.api.storage.value.Role;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.fixture.MemberFactory;
import so.morton.api.support.fixture.UserFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static so.morton.api.support.CodeExceptionAssert.assertCodeException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MemberService 테스트")
class MemberServiceTest {

    @Mock private MemberRepository memberRepository;
    @Mock private MemberFinder memberFinder;
    @Mock private so.morton.api.support.auth.otp.OtpService otpService;
    @InjectMocks private MemberService memberService;

    private static final Long USER_ID = UserFactory.FOREMAN_USER.id();

    @Nested
    @DisplayName("MemberService.get")
    class GetTests {

        @Test
        @DisplayName("조회 성공")
        void get_success() {
            // given
            Member expectedMember = MemberFactory.create(USER_ID);
            when(memberFinder.find(USER_ID)).thenReturn(expectedMember);

            // when
            Member result = memberService.get(UserFactory.FOREMAN_USER);

            // then
            assertThat(result).isEqualTo(expectedMember);
            verify(memberFinder).find(USER_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void get_notFound() {
            // given
            when(memberFinder.find(USER_ID))
                    .thenThrow(new so.morton.api.support.CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            assertCodeException(() -> memberService.get(UserFactory.FOREMAN_USER))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(memberFinder).find(USER_ID);
        }
    }

    @Nested
    @DisplayName("MemberService.register")
    class RegisterTests {

        @Test
        @DisplayName("등록 성공")
        void register_success() {
            // given
            RegisterMemberRequest request = MemberFactory.registerRequest();

            when(otpService.consumeToken("signupToken")).thenReturn("01000000000");
            when(memberRepository.findByUsername("username")).thenReturn(Optional.empty());
            when(memberRepository.findByPhone("01000000000")).thenReturn(Optional.empty());
            when(memberRepository.save(any(MemberEntity.class))).thenAnswer(invocation -> {
                MemberEntity entity = invocation.getArgument(0);
                ReflectionTestUtils.setField(entity, "id", USER_ID);
                ReflectionTestUtils.setField(entity, "createdAt", LocalDateTime.now());
                ReflectionTestUtils.setField(entity, "modifiedAt", LocalDateTime.now());
                return entity;
            });

            // when
            Member result = memberService.register(request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(USER_ID);
            assertThat(result.username()).isEqualTo("username");
            assertThat(result.name()).isEqualTo("name");
            assertThat(result.phone()).isEqualTo("01000000000");
            assertThat(result.picture()).isEqualTo("picture");
            assertThat(result.role()).isEqualTo(Role.FOREMAN);
            verify(memberRepository).findByUsername("username");
            verify(memberRepository).findByPhone("01000000000");
            verify(memberRepository).save(any(MemberEntity.class));
        }

        @Test
        @DisplayName("중복 username 시 DUPLICATE_USERNAME")
        void register_duplicateUsername() {
            // given
            RegisterMemberRequest request = MemberFactory.registerRequest();
            MemberEntity existing = MemberFactory.createEntity();

            when(otpService.consumeToken("signupToken")).thenReturn("01000000000");
            when(memberRepository.findByUsername("username")).thenReturn(Optional.of(existing));

            // when & then
            assertCodeException(() -> memberService.register(request))
                    .hasExceptionCode(MemberExceptionCode.DUPLICATE_USERNAME);
            verify(memberRepository).findByUsername("username");
            verify(memberRepository, never()).findByPhone(any());
            verify(memberRepository, never()).save(any());
        }

        @Test
        @DisplayName("중복 phone 시 DUPLICATE_PHONE")
        void register_duplicatePhone() {
            // given
            RegisterMemberRequest request = MemberFactory.registerRequest();
            MemberEntity existing = MemberFactory.createEntity();

            when(otpService.consumeToken("signupToken")).thenReturn("01000000000");
            when(memberRepository.findByUsername("username")).thenReturn(Optional.empty());
            when(memberRepository.findByPhone("01000000000")).thenReturn(Optional.of(existing));

            // when & then
            assertCodeException(() -> memberService.register(request))
                    .hasExceptionCode(MemberExceptionCode.DUPLICATE_PHONE);
            verify(memberRepository).findByUsername("username");
            verify(memberRepository).findByPhone("01000000000");
            verify(memberRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("MemberService.update")
    class UpdateTests {

        @Test
        @DisplayName("수정 성공")
        void update_success() {
            // given
            UpdateMemberRequest request = MemberFactory.updateRequest();
            MemberEntity entity = MemberFactory.createEntity();
            ReflectionTestUtils.setField(entity, "id", USER_ID);

            when(memberRepository.findById(USER_ID)).thenReturn(Optional.of(entity));

            // when
            memberService.update(UserFactory.FOREMAN_USER, request);

            // then
            assertThat(entity.getName()).isEqualTo("name");
            assertThat(entity.getPicture()).isEqualTo("picture");
            assertThat(entity.getRole()).isEqualTo(Role.CONTRACTOR);
            verify(memberRepository).findById(USER_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void update_notFound() {
            // given
            UpdateMemberRequest request = MemberFactory.updateRequest();

            when(memberRepository.findById(USER_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> memberService.update(UserFactory.FOREMAN_USER, request))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(memberRepository).findById(USER_ID);
        }

        @Test
        @DisplayName("null picture 수정 성공")
        void update_nullPicture() {
            // given
            UpdateMemberRequest request = new UpdateMemberRequest("김철수", null, Role.CONTRACTOR);
            MemberEntity entity = MemberFactory.createEntity();
            ReflectionTestUtils.setField(entity, "id", USER_ID);

            when(memberRepository.findById(USER_ID)).thenReturn(Optional.of(entity));

            // when
            memberService.update(UserFactory.FOREMAN_USER, request);

            // then
            assertThat(entity.getName()).isEqualTo("김철수");
            assertThat(entity.getPicture()).isNull();
            assertThat(entity.getRole()).isEqualTo(Role.CONTRACTOR);
            verify(memberRepository).findById(USER_ID);
        }
    }

    @Nested
    @DisplayName("MemberService.withdraw")
    class WithdrawTests {

        @Test
        @DisplayName("탈퇴 성공")
        void withdraw_success() {
            // given
            MemberEntity entity = MemberFactory.createEntity();
            ReflectionTestUtils.setField(entity, "id", USER_ID);

            when(memberRepository.findById(USER_ID)).thenReturn(Optional.of(entity));

            // when
            memberService.withdraw(UserFactory.FOREMAN_USER);

            // then
            verify(memberRepository).findById(USER_ID);
            verify(memberRepository).delete(entity);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void withdraw_notFound() {
            // given
            when(memberRepository.findById(USER_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> memberService.withdraw(UserFactory.FOREMAN_USER))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(memberRepository).findById(USER_ID);
            verify(memberRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("MemberFinder.find")
    class MemberFinderFindTests {

        @Mock
        private MemberRepository finderMemberRepository;

        @InjectMocks
        private MemberFinder memberFinder;

        @Test
        @DisplayName("조회 성공")
        void find_success() {
            // given
            MemberEntity entity = MemberFactory.createEntity();
            ReflectionTestUtils.setField(entity, "id", USER_ID);
            when(finderMemberRepository.findById(USER_ID)).thenReturn(Optional.of(entity));

            // when
            Member result = memberFinder.find(USER_ID);

            // then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(USER_ID);
            assertThat(result.username()).isEqualTo("username");
            verify(finderMemberRepository).findById(USER_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void find_notFound() {
            // given
            when(finderMemberRepository.findById(USER_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> memberFinder.find(USER_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(finderMemberRepository).findById(USER_ID);
        }
    }

    @Nested
    @DisplayName("MemberFinder.findByUsername")
    class MemberFinderFindByUsernameTests {

        @Mock
        private MemberRepository finderMemberRepository;

        @InjectMocks
        private MemberFinder memberFinder;

        @Test
        @DisplayName("조회 성공")
        void findByUsername_success() {
            // given
            MemberEntity entity = MemberFactory.createEntity();
            when(finderMemberRepository.findByUsername("username")).thenReturn(Optional.of(entity));

            // when
            Member result = memberFinder.findByUsername("username");

            // then
            assertThat(result).isNotNull();
            assertThat(result.username()).isEqualTo("username");
            assertThat(result.name()).isEqualTo("name");
            verify(finderMemberRepository).findByUsername("username");
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void findByUsername_notFound() {
            // given
            when(finderMemberRepository.findByUsername("username")).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> memberFinder.findByUsername("username"))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(finderMemberRepository).findByUsername("username");
        }
    }

    @Nested
    @DisplayName("MemberFinder.findAll")
    class MemberFinderFindAllTests {

        @Mock
        private MemberRepository finderMemberRepository;

        @InjectMocks
        private MemberFinder memberFinder;

        @Test
        @DisplayName("조회 성공")
        void findAll_success() {
            // given
            MemberEntity entity1 = MemberFactory.createEntity();
            ReflectionTestUtils.setField(entity1, "id", USER_ID);
            MemberEntity entity2 = MemberFactory.createEntity();
            ReflectionTestUtils.setField(entity2, "id", 2L);
            ReflectionTestUtils.setField(entity2, "username", "anotheruser");

            when(finderMemberRepository.findAll()).thenReturn(List.of(entity1, entity2));

            // when
            List<Member> result = memberFinder.findAll();

            // then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).id()).isEqualTo(USER_ID);
            assertThat(result.get(1).id()).isEqualTo(2L);
            verify(finderMemberRepository).findAll();
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void findAll_empty() {
            // given
            when(finderMemberRepository.findAll()).thenReturn(List.of());

            // when
            List<Member> result = memberFinder.findAll();

            // then
            assertThat(result).isEmpty();
            verify(finderMemberRepository).findAll();
        }
    }

    @Nested
    @DisplayName("MemberService.getAll")
    class GetAllTests {

        @Test
        @DisplayName("목록 조회 성공")
        void getAll_success() {
            // given
            List<Member> members = List.of(MemberFactory.create(USER_ID), MemberFactory.create(2L));
            when(memberFinder.findAll()).thenReturn(members);

            // when
            List<Member> result = memberService.getAll();

            // then
            assertThat(result).hasSize(2).isEqualTo(members);
            verify(memberFinder).findAll();
        }

        @Test
        @DisplayName("빈 목록 반환")
        void getAll_empty() {
            // given
            when(memberFinder.findAll()).thenReturn(List.of());

            // when
            List<Member> result = memberService.getAll();

            // then
            assertThat(result).isEmpty();
            verify(memberFinder).findAll();
        }
    }

    @Nested
    @DisplayName("MemberService.checkUsername")
    class CheckUsernameTests {

        @Test
        @DisplayName("미존재 사용자명 - 사용 가능")
        void checkUsername_available() {
            // given
            when(memberRepository.existsByUsername("neo")).thenReturn(false);

            // when
            boolean result = memberService.checkUsername("neo");

            // then
            assertThat(result).isTrue();
            verify(memberRepository).existsByUsername("neo");
        }

        @Test
        @DisplayName("중복 사용자명 - 사용 불가")
        void checkUsername_taken() {
            // given
            when(memberRepository.existsByUsername("taken")).thenReturn(true);

            // when
            boolean result = memberService.checkUsername("taken");

            // then
            assertThat(result).isFalse();
            verify(memberRepository).existsByUsername("taken");
        }
    }
}
