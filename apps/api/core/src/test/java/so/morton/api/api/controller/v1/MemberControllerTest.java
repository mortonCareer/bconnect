package so.morton.api.api.controller.v1;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import so.morton.api.api.controller.v1.request.RegisterMemberRequest;
import so.morton.api.api.controller.v1.request.UpdateMemberRequest;
import so.morton.api.domain.member.Member;
import so.morton.api.domain.member.MemberService;
import so.morton.api.storage.value.Role;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.auth.User;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static so.morton.api.support.TestUtils.errorResponse;
import static so.morton.api.support.TestUtils.successResponse;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class MemberControllerTest {

    @MockitoBean
    private MemberService memberService;

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final User TEST_USER = new User(1L, "testuser", "SKILLED");

    private static final Member SAMPLE_MEMBER = new Member(
            1L, "testuser", "홍길동", "01012345678", "pic.jpg",
            Role.SKILLED, LocalDateTime.now(), LocalDateTime.now()
    );

    @Nested
    @DisplayName("POST /api/v1/members")
    class CreateMember {

        @Test
        @DisplayName("회원 가입을 요청하면 성공 응답을 반환한다")
        void create_success() throws Exception {
            // given
            RegisterMemberRequest request = new RegisterMemberRequest(
                    "signup-token", "testuser", "홍길동", "pic.jpg", Role.SKILLED
            );
            when(memberService.register(any(RegisterMemberRequest.class))).thenReturn(SAMPLE_MEMBER);

            // when & then
            mockMvc.perform(post("/api/v1/members")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("필수 필드가 비어있으면 400을 반환한다")
        void create_invalidRequest() throws Exception {
            // given
            String body = "{\"signupToken\":\"\",\"username\":\"\",\"name\":\"\",\"picture\":\"\"}";

            // when & then
            mockMvc.perform(post("/api/v1/members")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_VALID));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/members/me")
    class GetMyInfo {

        @Test
        @DisplayName("인증된 사용자가 내 정보를 조회하면 성공 응답을 반환한다")
        void getMe_success() throws Exception {
            // given
            when(memberService.get(any(User.class))).thenReturn(SAMPLE_MEMBER);

            // when & then
            mockMvc.perform(get("/api/v1/members/me")
                            .with(user(TEST_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse())
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.name").value("홍길동"));
        }

        @Test
        @DisplayName("존재하지 않는 사용자를 조회하면 에러 응답을 반환한다")
        void getMe_notFound() throws Exception {
            // given
            when(memberService.get(any(User.class))).thenThrow(new CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            mockMvc.perform(get("/api/v1/members/me")
                            .with(user(TEST_USER)))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_FOUND));
        }

        @Test
        @DisplayName("인증 없이 내 정보를 조회하면 403을 반환한다")
        void getMe_unauthenticated() throws Exception {
            // when & then
            mockMvc.perform(get("/api/v1/members/me"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/members/me")
    class UpdateMyInfo {

        @Test
        @DisplayName("인증된 사용자가 내 정보를 수정하면 성공 응답을 반환한다")
        void updateMe_success() throws Exception {
            // given
            UpdateMemberRequest request = new UpdateMemberRequest("새이름", "new-pic.jpg", Role.SKILLED);
            doNothing().when(memberService).update(any(User.class), any(UpdateMemberRequest.class));

            // when & then
            mockMvc.perform(put("/api/v1/members/me")
                            .with(user(TEST_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("인증 없이 내 정보를 수정하면 403을 반환한다")
        void updateMe_unauthenticated() throws Exception {
            // given
            UpdateMemberRequest request = new UpdateMemberRequest("새이름", "new-pic.jpg", Role.SKILLED);

            // when & then
            mockMvc.perform(put("/api/v1/members/me")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/members/me")
    class DeleteMyInfo {

        @Test
        @DisplayName("인증된 사용자가 회원 탈퇴하면 성공 응답을 반환한다")
        void deleteMe_success() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/members/me")
                            .with(user(TEST_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());

            verify(memberService).withdraw(any(User.class));
        }

        @Test
        @DisplayName("인증 없이 회원을 탈퇴하면 403을 반환한다")
        void deleteMe_unauthenticated() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/members/me"))
                    .andExpect(status().isForbidden());
        }
    }
}
