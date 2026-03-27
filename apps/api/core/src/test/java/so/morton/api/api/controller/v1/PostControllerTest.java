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
import so.morton.api.api.controller.v1.request.CreatePostRequest;
import so.morton.api.domain.post.Post;
import so.morton.api.domain.post.PostService;
import so.morton.api.support.auth.User;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.fixture.PostFactory;
import so.morton.api.support.fixture.UserFactory;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static so.morton.api.support.TestUtils.successResponse;
import static so.morton.api.support.TestUtils.errorResponse;

@IntegrationTest
class PostControllerTest {

    @MockitoBean private PostService postService;
    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Post post = PostFactory.create(1L, 1L, 1L);

    @Nested
    @DisplayName("POST /api/v1/posts")
    class CreatePost {

        @Test
        @DisplayName("작성 성공")
        void create_success() throws Exception {
            // given
            var request = PostFactory.createRequest();
            when(postService.create(any(User.class), any(CreatePostRequest.class))).thenReturn(post);

            // when & then
            mockMvc.perform(post("/api/v1/posts")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("미인증 시 403")
        void create_unauthenticated() throws Exception {
            // given
            var request = PostFactory.createRequest();

            // when & then
            mockMvc.perform(post("/api/v1/posts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("images 빈 리스트 시 400")
        void create_emptyImages() throws Exception {
            // given
            String body = """
                    {"taskId":1,"images":[],"content":"content"}""";

            // when & then
            mockMvc.perform(post("/api/v1/posts")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_VALID));
        }

        @Test
        @DisplayName("images null 시 400")
        void create_nullImages() throws Exception {
            // given
            String body = """
                    {"taskId":1,"content":"content"}""";

            // when & then
            mockMvc.perform(post("/api/v1/posts")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_VALID));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/posts")
    class GetAllPosts {

        @Test
        @DisplayName("목록 조회 성공")
        void getAll_success() throws Exception {
            // given
            when(postService.getAll()).thenReturn(List.of(post));

            // when & then
            mockMvc.perform(get("/api/v1/posts"))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/posts/{id}")
    class GetPost {

        @Test
        @DisplayName("단건 조회 성공")
        void get_success() throws Exception {
            // given
            when(postService.get(1L)).thenReturn(post);

            // when & then
            mockMvc.perform(get("/api/v1/posts/{id}", 1L))
                    .andExpect(status().isOk())
                    .andExpect(successResponse())
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.content").value("content"));
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void get_notFound() throws Exception {
            // given
            when(postService.get(999L)).thenThrow(new CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            mockMvc.perform(get("/api/v1/posts/{id}", 999L))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/posts/{id}")
    class UpdatePost {

        @Test
        @DisplayName("수정 성공")
        void update_success() throws Exception {
            // given
            var request = PostFactory.updateRequest();

            // when & then
            mockMvc.perform(put("/api/v1/posts/{id}", 1L)
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("타인 수정 시 FORBIDDEN")
        void update_forbidden() throws Exception {
            // given
            var request = PostFactory.updateRequest();
            doThrow(new CodeException(CommonExceptionCode.FORBIDDEN))
                    .when(postService).update(any(User.class), eq(1L), any(String.class));

            // when & then
            mockMvc.perform(put("/api/v1/posts/{id}", 1L)
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(errorResponse(CommonExceptionCode.FORBIDDEN));
        }

        @Test
        @DisplayName("미인증 시 403")
        void update_unauthenticated() throws Exception {
            // given
            var request = PostFactory.updateRequest();

            // when & then
            mockMvc.perform(put("/api/v1/posts/{id}", 1L)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/posts/{id}")
    class DeletePost {

        @Test
        @DisplayName("삭제 성공")
        void delete_success() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/posts/{id}", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());

            verify(postService).delete(any(User.class), eq(1L));
        }

        @Test
        @DisplayName("타인 삭제 시 FORBIDDEN")
        void delete_forbidden() throws Exception {
            // given
            doThrow(new CodeException(CommonExceptionCode.FORBIDDEN))
                    .when(postService).delete(any(User.class), eq(1L));

            // when & then
            mockMvc.perform(delete("/api/v1/posts/{id}", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(errorResponse(CommonExceptionCode.FORBIDDEN));
        }

        @Test
        @DisplayName("미인증 시 403")
        void delete_unauthenticated() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/posts/{id}", 1L))
                    .andExpect(status().isForbidden());
        }
    }
}
