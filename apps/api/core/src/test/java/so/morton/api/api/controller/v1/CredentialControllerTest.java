package so.morton.api.api.controller.v1;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import so.morton.api.api.controller.v1.request.CreateCredentialRequest;
import so.morton.api.config.IntegrationTest;
import so.morton.api.domain.credential.Credential;
import so.morton.api.domain.credential.CredentialService;
import so.morton.api.storage.value.CredentialType;
import so.morton.api.support.auth.User;
import so.morton.api.support.fixture.CredentialFactory;
import so.morton.api.support.fixture.UserFactory;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static so.morton.api.support.TestUtils.successResponse;

@IntegrationTest
class CredentialControllerTest {

    @MockitoBean private CredentialService credentialService;
    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Credential credential = CredentialFactory.create(1L, 1L);

    @Nested
    @DisplayName("GET /api/v1/credentials")
    class GetCredentials {

        @Test
        @DisplayName("목록 조회 성공")
        void get_200() throws Exception {
            // given
            when(credentialService.getAll(1L)).thenReturn(List.of(credential));

            // when & then
            mockMvc.perform(get("/api/v1/credentials")
                            .param("profileId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/credentials")
    class CreateCredential {

        @Test
        @DisplayName("등록 성공")
        void create_200() throws Exception {
            // given
            CreateCredentialRequest request = new CreateCredentialRequest(CredentialType.IDENTITY_VERIFICATION, null);
            when(credentialService.create(any(User.class), any(CreateCredentialRequest.class)))
                    .thenReturn(credential);

            // when & then
            mockMvc.perform(post("/api/v1/credentials")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("type null 시 400")
        void create_400_nullType() throws Exception {
            // given
            CreateCredentialRequest request = new CreateCredentialRequest(null, null);

            // when & then
            mockMvc.perform(post("/api/v1/credentials")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/credentials/{id}")
    class DeleteCredential {

        @Test
        @DisplayName("삭제 성공")
        void delete_200() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/credentials/{id}", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());

            verify(credentialService).delete(any(User.class), eq(1L));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/credentials/{id}/accept")
    class AcceptCredential {

        @Test
        @DisplayName("승인 성공")
        void accept_200_admin() throws Exception {
            // when & then
            mockMvc.perform(post("/api/v1/credentials/{id}/accept", 1L)
                            .with(user(UserFactory.ADMIN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());

            verify(credentialService).accept(1L);
        }

        @Test
        @DisplayName("비ADMIN 시 403")
        void accept_403_nonAdmin() throws Exception {
            // when & then
            mockMvc.perform(post("/api/v1/credentials/{id}/accept", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/credentials/{id}/deny")
    class DenyCredential {

        @Test
        @DisplayName("거부 성공")
        void deny_200_admin() throws Exception {
            // when & then
            mockMvc.perform(post("/api/v1/credentials/{id}/deny", 1L)
                            .with(user(UserFactory.ADMIN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());

            verify(credentialService).deny(1L);
        }

        @Test
        @DisplayName("비ADMIN 시 403")
        void deny_403_nonAdmin() throws Exception {
            // when & then
            mockMvc.perform(post("/api/v1/credentials/{id}/deny", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isForbidden());
        }
    }
}
