package so.morton.api.api.controller.v1;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import so.morton.api.config.IntegrationTest;
import org.springframework.test.web.servlet.MockMvc;
import so.morton.api.api.controller.v1.request.CreateCoworkerRequest;
import so.morton.api.domain.coworker.CoworkerRequest;
import so.morton.api.domain.coworker.CoworkerRequestDetail;
import so.morton.api.domain.coworker.CoworkerRequestService;
import so.morton.api.domain.member.Member;
import so.morton.api.domain.profile.Profile;
import so.morton.api.support.auth.User;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.fixture.CoworkerRequestFactory;
import so.morton.api.support.fixture.MemberFactory;
import so.morton.api.support.fixture.ProfileFactory;
import so.morton.api.support.fixture.UserFactory;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static so.morton.api.support.TestUtils.successResponse;
import static so.morton.api.support.TestUtils.errorResponse;

@IntegrationTest
class CoworkerRequestControllerTest {

    @MockitoBean private CoworkerRequestService coworkerRequestService;
    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Nested
    @DisplayName("POST /api/v1/coworker-requests")
    class Create {

        @Test
        @DisplayName("생성 성공")
        void create_200() throws Exception {
            // given
            var request = CoworkerRequestFactory.createRequest(2L);
            CoworkerRequest coworkerRequest = CoworkerRequestFactory.create(1L, 1L, 2L);
            when(coworkerRequestService.create(any(User.class), eq(2L))).thenReturn(coworkerRequest);

            // when & then
            mockMvc.perform(post("/api/v1/coworker-requests")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("toProfileId null 시 400")
        void create_400_nullToId() throws Exception {
            // given
            CreateCoworkerRequest request = new CreateCoworkerRequest(null);

            // when & then
            mockMvc.perform(post("/api/v1/coworker-requests")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/coworker-requests/received")
    class GetReceived {

        @Test
        @DisplayName("받은 동료 요청 목록 조회 성공")
        void getReceived_200() throws Exception {
            // given
            Member member = MemberFactory.create(2L);
            Profile profile = ProfileFactory.create(2L, 2L);
            CoworkerRequestDetail detail = CoworkerRequestFactory.createDetail(1L, member, profile);
            when(coworkerRequestService.getReceived(any(User.class))).thenReturn(List.of(detail));

            // when & then
            mockMvc.perform(get("/api/v1/coworker-requests/received")
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].member.id").value(2))
                    .andExpect(jsonPath("$.data[0].profile.id").value(2));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/coworker-requests/sent")
    class GetSent {

        @Test
        @DisplayName("보낸 동료 요청 목록 조회 성공")
        void getSent_200() throws Exception {
            // given
            Member member = MemberFactory.create(3L);
            Profile profile = ProfileFactory.create(3L, 3L);
            CoworkerRequestDetail detail = CoworkerRequestFactory.createDetail(1L, member, profile);
            when(coworkerRequestService.getSent(any(User.class))).thenReturn(List.of(detail));

            // when & then
            mockMvc.perform(get("/api/v1/coworker-requests/sent")
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].member.id").value(3))
                    .andExpect(jsonPath("$.data[0].profile.id").value(3));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/coworker-requests/{id}/accept")
    class Accept {

        @Test
        @DisplayName("수락 성공")
        void accept_200() throws Exception {
            // when & then
            mockMvc.perform(post("/api/v1/coworker-requests/{id}/accept", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());

            verify(coworkerRequestService).accept(any(User.class), eq(1L));
        }

        @Test
        @DisplayName("타인 요청 시 FORBIDDEN")
        void accept_403_forbidden() throws Exception {
            // given
            doThrow(new CodeException(CommonExceptionCode.FORBIDDEN))
                    .when(coworkerRequestService).accept(any(User.class), eq(1L));

            // when & then
            mockMvc.perform(post("/api/v1/coworker-requests/{id}/accept", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(errorResponse(CommonExceptionCode.FORBIDDEN));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/coworker-requests/{id}/deny")
    class Deny {

        @Test
        @DisplayName("거절 성공")
        void deny_200() throws Exception {
            // when & then
            mockMvc.perform(post("/api/v1/coworker-requests/{id}/deny", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());

            verify(coworkerRequestService).deny(any(User.class), eq(1L));
        }

        @Test
        @DisplayName("타인 요청 시 FORBIDDEN")
        void deny_403_forbidden() throws Exception {
            // given
            doThrow(new CodeException(CommonExceptionCode.FORBIDDEN))
                    .when(coworkerRequestService).deny(any(User.class), eq(1L));

            // when & then
            mockMvc.perform(post("/api/v1/coworker-requests/{id}/deny", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(errorResponse(CommonExceptionCode.FORBIDDEN));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/coworker-requests/{id}")
    class Cancel {

        @Test
        @DisplayName("취소 성공")
        void cancel_200() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/coworker-requests/{id}", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());

            verify(coworkerRequestService).cancel(any(User.class), eq(1L));
        }

        @Test
        @DisplayName("타인 요청 시 FORBIDDEN")
        void cancel_403_forbidden() throws Exception {
            // given
            doThrow(new CodeException(CommonExceptionCode.FORBIDDEN))
                    .when(coworkerRequestService).cancel(any(User.class), eq(1L));

            // when & then
            mockMvc.perform(delete("/api/v1/coworker-requests/{id}", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(errorResponse(CommonExceptionCode.FORBIDDEN));
        }
    }
}
