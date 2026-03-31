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
import so.morton.api.api.controller.v1.request.CreateTaskRequest;
import so.morton.api.api.controller.v1.request.UpdateTaskRequest;
import so.morton.api.domain.task.Task;
import so.morton.api.domain.task.TaskService;
import so.morton.api.storage.support.Address;
import so.morton.api.storage.value.Trade;
import so.morton.api.support.auth.User;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

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

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class TaskControllerTest {

    @MockitoBean
    private TaskService taskService;

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final User TEST_USER = new User(1L, "testuser", "SKILLED");

    private static final Address SAMPLE_ADDRESS = new Address(
            "12345", "Seoul", "Gangnam", "Main St", "101", BigDecimal.ZERO, BigDecimal.ZERO);

    private static final Task SAMPLE_TASK = new Task(
            1L, 1L, "Test Company", SAMPLE_ADDRESS, "Task Title", "Event Title",
            Set.of(Trade.DESIGN), LocalDate.now(), LocalDate.now().plusDays(7),
            LocalDateTime.now(), LocalDateTime.now());

    @Nested
    @DisplayName("POST /api/v1/tasks")
    class CreateTask {

        @Test
        @DisplayName("인증된 사용자가 일감을 작성하면 성공 응답을 반환한다")
        void create_success() throws Exception {
            // given
            CreateTaskRequest request = new CreateTaskRequest(
                    "Test Company", SAMPLE_ADDRESS, "Task Title", "Event Title",
                    Set.of(Trade.DESIGN), LocalDate.now(), LocalDate.now().plusDays(7));
            when(taskService.create(any(User.class), any(CreateTaskRequest.class))).thenReturn(SAMPLE_TASK);

            // when & then
            mockMvc.perform(post("/api/v1/tasks")
                            .with(user(TEST_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("인증 없이 일감을 작성하면 403을 반환한다")
        void create_unauthenticated() throws Exception {
            // given
            CreateTaskRequest request = new CreateTaskRequest(
                    "Test Company", SAMPLE_ADDRESS, "Task Title", "Event Title",
                    Set.of(Trade.DESIGN), LocalDate.now(), LocalDate.now().plusDays(7));

            // when & then
            mockMvc.perform(post("/api/v1/tasks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/tasks/me")
    class GetMyTasks {

        @Test
        @DisplayName("인증된 사용자가 내 일감 목록을 조회하면 성공 응답을 반환한다")
        void getAll_success() throws Exception {
            // given
            when(taskService.getAll(any(User.class))).thenReturn(List.of(SAMPLE_TASK));

            // when & then
            mockMvc.perform(get("/api/v1/tasks/me")
                            .with(user(TEST_USER)))
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
        @DisplayName("일감을 단건 조회하면 성공 응답을 반환한다")
        void get_success() throws Exception {
            // given
            when(taskService.get(1L)).thenReturn(SAMPLE_TASK);

            // when & then
            mockMvc.perform(get("/api/v1/tasks/{id}", 1L))
                    .andExpect(status().isOk())
                    .andExpect(successResponse())
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.taskTitle").value("Task Title"));
        }

        @Test
        @DisplayName("존재하지 않는 일감을 조회하면 에러 응답을 반환한다")
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
        @DisplayName("인증된 사용자가 일감을 수정하면 성공 응답을 반환한다")
        void update_success() throws Exception {
            // given
            UpdateTaskRequest request = new UpdateTaskRequest(
                    "Updated Company", SAMPLE_ADDRESS, "Updated Title", "Updated Event",
                    Set.of(Trade.DESIGN), LocalDate.now(), LocalDate.now().plusDays(14));
            doNothing().when(taskService).update(any(User.class), eq(1L), any(UpdateTaskRequest.class));

            // when & then
            mockMvc.perform(put("/api/v1/tasks/{id}", 1L)
                            .with(user(TEST_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("다른 사용자의 일감을 수정하면 403을 반환한다")
        void update_forbidden() throws Exception {
            // given
            UpdateTaskRequest request = new UpdateTaskRequest(
                    "Updated Company", SAMPLE_ADDRESS, "Updated Title", "Updated Event",
                    Set.of(Trade.DESIGN), LocalDate.now(), LocalDate.now().plusDays(14));
            doThrow(new CodeException(CommonExceptionCode.FORBIDDEN))
                    .when(taskService).update(any(User.class), eq(1L), any(UpdateTaskRequest.class));

            // when & then
            mockMvc.perform(put("/api/v1/tasks/{id}", 1L)
                            .with(user(TEST_USER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(errorResponse(CommonExceptionCode.FORBIDDEN));
        }

        @Test
        @DisplayName("인증 없이 일감을 수정하면 403을 반환한다")
        void update_unauthenticated() throws Exception {
            // given
            UpdateTaskRequest request = new UpdateTaskRequest(
                    "Updated Company", SAMPLE_ADDRESS, "Updated Title", "Updated Event",
                    Set.of(Trade.DESIGN), LocalDate.now(), LocalDate.now().plusDays(14));

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
        @DisplayName("인증된 사용자가 일감을 삭제하면 성공 응답을 반환한다")
        void delete_success() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/tasks/{id}", 1L)
                            .with(user(TEST_USER)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());

            verify(taskService).delete(any(User.class), eq(1L));
        }

        @Test
        @DisplayName("다른 사용자의 일감을 삭제하면 403을 반환한다")
        void delete_forbidden() throws Exception {
            // given
            doThrow(new CodeException(CommonExceptionCode.FORBIDDEN))
                    .when(taskService).delete(any(User.class), eq(1L));

            // when & then
            mockMvc.perform(delete("/api/v1/tasks/{id}", 1L)
                            .with(user(TEST_USER)))
                    .andExpect(errorResponse(CommonExceptionCode.FORBIDDEN));
        }

        @Test
        @DisplayName("인증 없이 일감을 삭제하면 403을 반환한다")
        void delete_unauthenticated() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/tasks/{id}", 1L))
                    .andExpect(status().isForbidden());
        }
    }
}
