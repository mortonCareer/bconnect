package so.morton.api.api.controller.v1;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import so.morton.api.api.controller.v1.request.CreatePostRequest;
import so.morton.api.api.controller.v1.request.UpdatePostRequest;
import so.morton.api.domain.post.Post;
import so.morton.api.domain.post.PostService;
import so.morton.api.support.auth.User;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.time.LocalDateTime;
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

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class PostControllerTest {

    @MockitoBean
    private PostService postService;

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final User TEST_USER = new User(1L, "testuser", "SKILLED");

    private static final Post SAMPLE_POST = new Post(
            1L, 1L, 1L, List.of("img1.jpg"), "content",
            LocalDateTime.now(), LocalDateTime.now()
    );

    @Nested
    @DisplayName("POST /api/v1/posts")
    class CreatePost {

        @Test
        @DisplayName("인증된 사용자가 게시글을 작성하면 성공 응답을 반환한다")
        void create_success() throws Exception {
            // given
            CreatePostRequest request = new CreatePostRequest(1L, List.of("img1.jpg"), "content");
            when(postService.create(any(User.class), any(CreatePostRequest.class))).thenReturn(SAMPLE_POST);

            // when & then
            mockMvc.perform(post("/api/v1/posts")
                            .with(user(TEST_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("인증 없이 게시글을 작성하면 403을 반환한다")
        void create_unauthenticated() throws Exception {
            // given
            CreatePostRequest request = new CreatePostRequest(1L, List.of("img1.jpg"), "content");

            // when & then
            mockMvc.perform(post("/api/v1/posts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/posts")
    class GetAllPosts {

        @Test
        @DisplayName("게시글 목록을 조회하면 성공 응답을 반환한다")
        void getAll_success() throws Exception {
            // given
            when(postService.getAll()).thenReturn(List.of(SAMPLE_POST));

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
        @DisplayName("게시글을 단건 조회하면 성공 응답을 반환한다")
        void get_success() throws Exception {
            // given
            when(postService.get(1L)).thenReturn(SAMPLE_POST);

            // when & then
            mockMvc.perform(get("/api/v1/posts/{id}", 1L))
                    .andExpect(status().isOk())
                    .andExpect(successResponse())
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.content").value("content"));
        }

        @Test
        @DisplayName("존재하지 않는 게시글을 조회하면 에러 응답을 반환한다")
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
        @DisplayName("인증된 사용자가 게시글을 수정하면 성공 응답을 반환한다")
        void update_success() throws Exception {
            // given
            UpdatePostRequest request = new UpdatePostRequest("updated content");

            // when & then
            mockMvc.perform(put("/api/v1/posts/{id}", 1L)
                            .with(user(TEST_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("다른 사용자의 게시글을 수정하면 403을 반환한다")
        void update_forbidden() throws Exception {
            // given
            UpdatePostRequest request = new UpdatePostRequest("updated content");
            doThrow(new CodeException(CommonExceptionCode.FORBIDDEN))
                    .when(postService).update(any(User.class), eq(1L), any(String.class));

            // when & then
            mockMvc.perform(put("/api/v1/posts/{id}", 1L)
                            .with(user(TEST_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(errorResponse(CommonExceptionCode.FORBIDDEN));
        }

        @Test
        @DisplayName("인증 없이 게시글을 수정하면 403을 반환한다")
        void update_unauthenticated() throws Exception {
            // given
            UpdatePostRequest request = new UpdatePostRequest("updated content");

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
        @DisplayName("인증된 사용자가 게시글을 삭제하면 성공 응답을 반환한다")
        void delete_success() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/posts/{id}", 1L)
                            .with(user(TEST_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());

            verify(postService).delete(any(User.class), eq(1L));
        }

        @Test
        @DisplayName("다른 사용자의 게시글을 삭제하면 403을 반환한다")
        void delete_forbidden() throws Exception {
            // given
            doThrow(new CodeException(CommonExceptionCode.FORBIDDEN))
                    .when(postService).delete(any(User.class), eq(1L));

            // when & then
            mockMvc.perform(delete("/api/v1/posts/{id}", 1L)
                            .with(user(TEST_USER)))
                    .andExpect(errorResponse(CommonExceptionCode.FORBIDDEN));
        }

        @Test
        @DisplayName("인증 없이 게시글을 삭제하면 403을 반환한다")
        void delete_unauthenticated() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/posts/{id}", 1L))
                    .andExpect(status().isForbidden());
        }
    }
}
