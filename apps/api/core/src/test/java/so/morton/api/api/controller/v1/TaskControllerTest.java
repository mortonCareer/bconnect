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
import so.morton.api.api.controller.v1.request.CreateTaskRequest;
import so.morton.api.api.controller.v1.request.UpdateTaskRequest;
import so.morton.api.domain.task.Task;
import so.morton.api.domain.task.TaskService;
import so.morton.api.support.auth.User;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.fixture.TaskFactory;
import so.morton.api.support.fixture.UserFactory;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.doNothing;
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
class TaskControllerTest {

    @MockitoBean private TaskService taskService;
    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Task task = TaskFactory.create(1L, 1L);

    @Nested
    @DisplayName("POST /api/v1/tasks")
    class CreateTask {

        @Test
        @DisplayName("작성 성공")
        void create_success() throws Exception {
            // given
            var request = TaskFactory.createRequest();
            when(taskService.create(any(User.class), any(CreateTaskRequest.class))).thenReturn(task);

            // when & then
            mockMvc.perform(post("/api/v1/tasks")
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
            var request = TaskFactory.createRequest();

            // when & then
            mockMvc.perform(post("/api/v1/tasks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("company 빈 문자열 시 400")
        void create_blankCompany() throws Exception {
            // given
            String body = """
                    {"company":"","address":{"zipCode":"00000","city":"city","state":"state","street":"street","detail":"detail","latitude":0,"longitude":0},"taskTitle":"title","eventTitle":"event","trades":["DESIGN"],"start":"2026-01-01","end":"2026-01-08"}""";

            // when & then
            mockMvc.perform(post("/api/v1/tasks")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_VALID));
        }

        @Test
        @DisplayName("start null 시 400")
        void create_nullStart() throws Exception {
            // given
            String body = """
                    {"company":"company","address":{"zipCode":"00000","city":"city","state":"state","street":"street","detail":"detail","latitude":0,"longitude":0},"taskTitle":"title","eventTitle":"event","trades":["DESIGN"],"end":"2026-01-08"}""";

            // when & then
            mockMvc.perform(post("/api/v1/tasks")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_VALID));
        }

        @Test
        @DisplayName("address null 시 400")
        void create_nullAddress() throws Exception {
            // given
            String body = """
                    {"company":"company","taskTitle":"title","eventTitle":"event","trades":["DESIGN"],"start":"2026-01-01","end":"2026-01-08"}""";

            // when & then
            mockMvc.perform(post("/api/v1/tasks")
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_VALID));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/tasks/me")
    class GetMyTasks {

        @Test
        @DisplayName("목록 조회 성공")
        void getAll_success() throws Exception {
            // given
            when(taskService.getAll(any(User.class))).thenReturn(List.of(task));

            // when & then
            mockMvc.perform(get("/api/v1/tasks")
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("인증 없이 내 일감 목록을 조회하면 403을 반환한다")
        void getAll_unauthenticated() throws Exception {
            // when & then
            mockMvc.perform(get("/api/v1/tasks/me"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/tasks/{id}")
    class GetTask {

        @Test
        @DisplayName("단건 조회 성공")
        void get_success() throws Exception {
            // given
            when(taskService.get(1L)).thenReturn(task);

            // when & then
            mockMvc.perform(get("/api/v1/tasks/{id}", 1L))
                    .andExpect(status().isOk())
                    .andExpect(successResponse())
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.taskTitle").value("task"));
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void get_notFound() throws Exception {
            // given
            when(taskService.get(999L)).thenThrow(new CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            mockMvc.perform(get("/api/v1/tasks/{id}", 999L))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/tasks/{id}")
    class UpdateTask {

        @Test
        @DisplayName("수정 성공")
        void update_success() throws Exception {
            // given
            var request = TaskFactory.updateRequest();
            doNothing().when(taskService).update(any(User.class), eq(1L), any(UpdateTaskRequest.class));

            // when & then
            mockMvc.perform(put("/api/v1/tasks/{id}", 1L)
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
            var request = TaskFactory.updateRequest();
            doThrow(new CodeException(CommonExceptionCode.FORBIDDEN))
                    .when(taskService).update(any(User.class), eq(1L), any(UpdateTaskRequest.class));

            // when & then
            mockMvc.perform(put("/api/v1/tasks/{id}", 1L)
                            .with(user(UserFactory.FOREMAN_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(errorResponse(CommonExceptionCode.FORBIDDEN));
        }

        @Test
        @DisplayName("미인증 시 403")
        void update_unauthenticated() throws Exception {
            // given
            var request = TaskFactory.updateRequest();

            // when & then
            mockMvc.perform(put("/api/v1/tasks/{id}", 1L)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/tasks/{id}")
    class DeleteTask {

        @Test
        @DisplayName("삭제 성공")
        void delete_success() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/tasks/{id}", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());

            verify(taskService).delete(any(User.class), eq(1L));
        }

        @Test
        @DisplayName("타인 삭제 시 FORBIDDEN")
        void delete_forbidden() throws Exception {
            // given
            doThrow(new CodeException(CommonExceptionCode.FORBIDDEN))
                    .when(taskService).delete(any(User.class), eq(1L));

            // when & then
            mockMvc.perform(delete("/api/v1/tasks/{id}", 1L)
                            .with(user(UserFactory.FOREMAN_USER)))
                    .andExpect(errorResponse(CommonExceptionCode.FORBIDDEN));
        }

        @Test
        @DisplayName("미인증 시 403")
        void delete_unauthenticated() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/tasks/{id}", 1L))
                    .andExpect(status().isForbidden());
        }
    }
}
