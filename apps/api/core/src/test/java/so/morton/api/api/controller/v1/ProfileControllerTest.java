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
import so.morton.api.api.controller.v1.request.CreateProfileRequest;
import so.morton.api.api.controller.v1.request.UpdateProfileRequest;
import so.morton.api.api.controller.v1.request.UpdateProfileAboutRequest;
import so.morton.api.domain.profile.Profile;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.domain.profile.ProfileService;
import so.morton.api.domain.profile.ProfileExceptionCode;
import so.morton.api.support.auth.User;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.fixture.ProfileFactory;
import so.morton.api.support.fixture.UserFactory;
import so.morton.api.storage.value.Trade;

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static so.morton.api.support.TestUtils.errorResponse;
import static so.morton.api.support.TestUtils.successResponse;

@IntegrationTest
class ProfileControllerTest {

    @MockitoBean private ProfileService profileService;
    @MockitoBean private ProfileFinder profileFinder;
    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Profile profile = ProfileFactory.create(1L, 1L);

    @Nested
    @DisplayName("GET /api/v1/profiles")
    class GetAllProfiles {

        @Test
        @DisplayName("목록 조회 성공")
        void getAll_200() throws Exception {
            // given
            when(profileFinder.findAll()).thenReturn(List.of(profile));

            // when & then
            mockMvc.perform(get("/api/v1/profiles"))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/profiles/{id}")
    class GetProfile {

        @Test
        @DisplayName("단건 조회 성공")
        void get_200() throws Exception {
            // given
            when(profileFinder.find(1L)).thenReturn(profile);

            // when & then
            mockMvc.perform(get("/api/v1/profiles/{id}", 1L))
                    .andExpect(status().isOk())
                    .andExpect(successResponse())
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.primaryTrade").value("ELECTRICAL"));
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void get_404() throws Exception {
            // given
            when(profileFinder.find(999L)).thenThrow(new CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            mockMvc.perform(get("/api/v1/profiles/{id}", 999L))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/profiles")
    class CreateProfile {

        @Test
        @DisplayName("생성 성공")
        void create_200() throws Exception {
            // given
            var request = ProfileFactory.createRequest();
            when(profileService.create(any(User.class), any(CreateProfileRequest.class)))
                    .thenReturn(profile);

            // when & then
            mockMvc.perform(post("/api/v1/profiles")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("중복 시 ALREADY_EXISTS")
        void create_409_alreadyExists() throws Exception {
            // given
            var request = ProfileFactory.createRequest();
            when(profileService.create(any(User.class), any(CreateProfileRequest.class)))
                    .thenThrow(new CodeException(ProfileExceptionCode.ALREADY_EXISTS));

            // when & then
            mockMvc.perform(post("/api/v1/profiles")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(errorResponse(ProfileExceptionCode.ALREADY_EXISTS));
        }

        @Test
        @DisplayName("primaryTrade null 시 400")
        void create_400_invalidRequest() throws Exception {
            // given
            CreateProfileRequest request = new CreateProfileRequest(
                    null, Set.of(Trade.ELECTRICAL),
                    5, "headline", "about", ProfileFactory.ADDRESS
            );

            // when & then
            mockMvc.perform(post("/api/v1/profiles")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("trades null 시 400")
        void create_400_emptyTrades() throws Exception {
            // given
            CreateProfileRequest request = new CreateProfileRequest(
                    Trade.ELECTRICAL, null,
                    5, "headline", "about", ProfileFactory.ADDRESS
            );

            // when & then
            mockMvc.perform(post("/api/v1/profiles")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("미인증 시 403")
        void unauthenticated_401() throws Exception {
            // when & then
            mockMvc.perform(post("/api/v1/profiles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/profiles/me")
    class UpdateProfile {

        @Test
        @DisplayName("수정 성공")
        void update_200() throws Exception {
            // given
            var request = ProfileFactory.updateRequest();

            // when & then
            mockMvc.perform(put("/api/v1/profiles/me")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void update_404_notFound() throws Exception {
            // given
            var request = ProfileFactory.updateRequest();
            doThrow(new CodeException(CommonExceptionCode.NOT_FOUND))
                    .when(profileService).update(any(User.class), any(UpdateProfileRequest.class));

            // when & then
            mockMvc.perform(put("/api/v1/profiles/me")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("PATCH /api/v1/profiles/me/about")
    class UpdateProfileAbout {

        @Test
        @DisplayName("수정 성공")
        void updateAbout_200() throws Exception {
            // given
            UpdateProfileAboutRequest request = new UpdateProfileAboutRequest("새로운 자기소개");

            // when & then
            mockMvc.perform(patch("/api/v1/profiles/me/about")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/profiles/me")
    class DeleteProfile {

        @Test
        @DisplayName("삭제 성공")
        void delete_200() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/profiles/me")
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());

            verify(profileService).delete(any(User.class));
        }
    }
}
