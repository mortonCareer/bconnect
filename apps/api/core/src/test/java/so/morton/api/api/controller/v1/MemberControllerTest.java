package so.morton.api.api.controller.v1;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import so.morton.api.config.IntegrationTest;
import org.springframework.test.web.servlet.MockMvc;
import so.morton.api.api.controller.v1.request.RegisterMemberRequest;
import so.morton.api.api.controller.v1.request.UpdateMemberRequest;
import so.morton.api.domain.member.Member;
import so.morton.api.domain.member.MemberService;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.auth.User;
import so.morton.api.support.fixture.MemberFactory;
import so.morton.api.support.fixture.UserFactory;
import tools.jackson.databind.ObjectMapper;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static so.morton.api.support.TestUtils.errorResponse;
import static so.morton.api.support.TestUtils.successResponse;

@IntegrationTest
class MemberControllerTest {

    @MockitoBean private MemberService memberService;
    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Member member = MemberFactory.create(1L);

    @Nested
    @DisplayName("POST /api/v1/members")
    class CreateMember {

        @Test
        @DisplayName("가입 성공")
        void create_success() throws Exception {
            // given
            var request = MemberFactory.registerRequest();
            when(memberService.register(any(RegisterMemberRequest.class))).thenReturn(member);

            // when & then
            mockMvc.perform(post("/api/v1/members")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("필수 필드 누락 시 400")
        void create_invalidRequest() throws Exception {
            // given
            String body = "{\"signupToken\":\"\",\"username\":\"\",\"name\":\"\",\"picture\":\"\"}";

            // when & then
            mockMvc.perform(post("/api/v1/members")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_VALID));
        }

        @Test
        @DisplayName("phone 잘못된 패턴 시 400")
        void create_invalidPhonePattern() throws Exception {
            // given
            String body = """
                    {"signupToken":"token","username":"user","name":"name","phone":"010-1234-5678","picture":"pic.jpg","role":"SKILLED"}""";

            // when & then
            mockMvc.perform(post("/api/v1/members")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_VALID));
        }

        @Test
        @DisplayName("role null 시 400")
        void create_nullRole() throws Exception {
            // given
            String body = """
                    {"signupToken":"token","username":"user","name":"name","phone":"01000000000","picture":"pic.jpg"}""";

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
        @DisplayName("조회 성공")
        void getMe_success() throws Exception {
            // given
            when(memberService.get(any(User.class))).thenReturn(member);

            // when & then
            mockMvc.perform(get("/api/v1/members/me")
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse())
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.name").value("name"));
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void getMe_notFound() throws Exception {
            // given
            when(memberService.get(any(User.class))).thenThrow(new CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            mockMvc.perform(get("/api/v1/members/me")
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_FOUND));
        }

        @Test
        @DisplayName("미인증 시 403")
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
        @DisplayName("수정 성공")
        void updateMe_success() throws Exception {
            // given
            var request = MemberFactory.updateRequest();
            doNothing().when(memberService).update(any(User.class), any(UpdateMemberRequest.class));

            // when & then
            mockMvc.perform(put("/api/v1/members/me")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("미인증 시 403")
        void updateMe_unauthenticated() throws Exception {
            // given
            var request = MemberFactory.updateRequest();

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
        @DisplayName("탈퇴 성공")
        void deleteMe_success() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/members/me")
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());

            verify(memberService).withdraw(any(User.class));
        }

        @Test
        @DisplayName("미인증 시 403")
        void deleteMe_unauthenticated() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/members/me"))
                    .andExpect(status().isForbidden());
        }
    }
}
