package so.morton.api.api.controller.v1;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import so.morton.api.config.IntegrationTest;
import so.morton.api.domain.coworker.Coworker;
import so.morton.api.domain.coworker.CoworkerExceptionCode;
import so.morton.api.domain.coworker.CoworkerService;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.auth.User;
import so.morton.api.support.fixture.CoworkerFactory;
import so.morton.api.support.fixture.UserFactory;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static so.morton.api.support.TestUtils.errorResponse;
import static so.morton.api.support.TestUtils.successResponse;

@IntegrationTest
class CoworkerControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private CoworkerService coworkerService;

    private final Coworker coworker = CoworkerFactory.create(1L, 1L, 2L);

    @Nested
    @DisplayName("GET /api/v1/coworkers")
    class GetCoworkers {

        @Test
        @DisplayName("조회 성공")
        void get_200() throws Exception {
            // given
            when(coworkerService.getAll(any(User.class), eq(1L))).thenReturn(List.of(coworker));

            // when & then
            mockMvc.perform(get("/api/v1/coworkers")
                            .with(user(UserFactory.FOREMAN_USER))
                            .param("profileId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("비동료 조회 시 FORBIDDEN")
        void get_403_forbidden() throws Exception {
            // given
            when(coworkerService.getAll(any(User.class), eq(99L)))
                    .thenThrow(new CodeException(CommonExceptionCode.FORBIDDEN));

            // when & then
            mockMvc.perform(get("/api/v1/coworkers")
                            .with(user(UserFactory.FOREMAN_USER))
                            .param("profileId", "99"))
                    .andExpect(errorResponse(CommonExceptionCode.FORBIDDEN));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/coworkers/{id}")
    class DeleteCoworker {

        @Test
        @DisplayName("삭제 성공")
        void delete_200() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/coworkers/{id}", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());

            verify(coworkerService).delete(any(User.class), eq(1L));
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void delete_404_notFound() throws Exception {
            // given
            doThrow(new CodeException(CoworkerExceptionCode.NOT_FOUND))
                    .when(coworkerService).delete(any(User.class), eq(999L));

            // when & then
            mockMvc.perform(delete("/api/v1/coworkers/{id}", 999L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(errorResponse(CoworkerExceptionCode.NOT_FOUND));
        }

        @Test
        @DisplayName("타인 삭제 시 FORBIDDEN")
        void delete_403_forbidden() throws Exception {
            // given
            doThrow(new CodeException(CommonExceptionCode.FORBIDDEN))
                    .when(coworkerService).delete(any(User.class), eq(1L));

            // when & then
            mockMvc.perform(delete("/api/v1/coworkers/{id}", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(errorResponse(CommonExceptionCode.FORBIDDEN));
        }
    }
}
