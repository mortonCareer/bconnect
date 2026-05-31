package to.bconnect.api.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.test.util.ReflectionTestUtils;
import to.bconnect.api.api.controller.v1.request.CreateTaskRequest;
import to.bconnect.api.api.controller.v1.request.UpdateTaskRequest;
import to.bconnect.api.domain.profile.Profile;
import to.bconnect.api.domain.profile.ProfileFinder;
import to.bconnect.api.domain.task.Task;
import to.bconnect.api.domain.task.TaskFinder;
import to.bconnect.api.domain.task.TaskService;
import to.bconnect.api.storage.domain.task.TaskEntity;
import to.bconnect.api.storage.domain.task.TaskRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.support.UnitTest;
import to.bconnect.api.support.fixture.ProfileFactory;
import to.bconnect.api.support.fixture.TaskFactory;
import to.bconnect.api.support.fixture.UserFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@UnitTest
@DisplayName("TaskService 테스트")
class TaskServiceTest {

    @Mock private TaskRepository taskRepository;
    @Mock private TaskFinder taskFinder;
    @Mock private ProfileFinder profileFinder;
    @InjectMocks private TaskService taskService;

    private static final Long USER_ID = 1L;
    private static final Long PROFILE_ID = 2L;
    private static final Long TASK_ID = 3L;
    private static final LocalDate START_DATE = LocalDate.of(2024, 1, 1);
    private static final LocalDate END_DATE = LocalDate.of(2024, 12, 31);

    @Nested
    @DisplayName("TaskService.get")
    class GetTests {

        @Test
        @DisplayName("조회 성공")
        void get_success() {
            // given
            Task expectedTask = TaskFactory.create(TASK_ID, PROFILE_ID);
            when(taskFinder.find(TASK_ID)).thenReturn(expectedTask);

            // when
            Task result = taskService.get(TASK_ID);

            // then
            assertThat(result).isEqualTo(expectedTask);
            verify(taskFinder).find(TASK_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void get_notFound() {
            // given
            when(taskFinder.find(TASK_ID))
                    .thenThrow(new CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            assertCodeException(() -> taskService.get(TASK_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(taskFinder).find(TASK_ID);
        }
    }

    @Nested
    @DisplayName("TaskService.getAll")
    class GetAllTests {

        @Test
        @DisplayName("조회 성공")
        void getAll_success() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            Task task1 = TaskFactory.create(1L, PROFILE_ID);
            Task task2 = TaskFactory.create(2L, PROFILE_ID);
            List<Task> expectedTasks = List.of(task1, task2);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(taskFinder.findByProfileId(PROFILE_ID)).thenReturn(expectedTasks);

            // when
            List<Task> result = taskService.getAll(UserFactory.FOREMAN_USER);

            // then
            assertThat(result).isEqualTo(expectedTasks);
            assertThat(result).hasSize(2);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(taskFinder).findByProfileId(PROFILE_ID);
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void getAll_empty() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(taskFinder.findByProfileId(PROFILE_ID)).thenReturn(List.of());

            // when
            List<Task> result = taskService.getAll(UserFactory.FOREMAN_USER);

            // then
            assertThat(result).isEmpty();
            verify(profileFinder).findByMemberId(USER_ID);
            verify(taskFinder).findByProfileId(PROFILE_ID);
        }
    }

    @Nested
    @DisplayName("TaskService.create")
    class CreateTests {

        @Test
        @DisplayName("생성 성공")
        void create_success() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            CreateTaskRequest request = TaskFactory.createRequest();

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(taskRepository.save(any(TaskEntity.class))).thenAnswer(invocation -> {
                TaskEntity entity = invocation.getArgument(0);
                ReflectionTestUtils.setField(entity, "id", TASK_ID);
                ReflectionTestUtils.setField(entity, "createdAt", LocalDateTime.now());
                ReflectionTestUtils.setField(entity, "modifiedAt", LocalDateTime.now());
                return entity;
            });

            // when
            Task result = taskService.create(UserFactory.FOREMAN_USER, request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(TASK_ID);
            assertThat(result.profileId()).isEqualTo(PROFILE_ID);
            assertThat(result.company()).isEqualTo("company");
            verify(profileFinder).findByMemberId(USER_ID);
            verify(taskRepository).save(any(TaskEntity.class));
        }

        @Test
        @DisplayName("프로필 미존재 시 NOT_FOUND")
        void create_profileNotFound() {
            // given
            CreateTaskRequest request = TaskFactory.createRequest();

            when(profileFinder.findByMemberId(USER_ID))
                    .thenThrow(new CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            assertCodeException(() -> taskService.create(UserFactory.FOREMAN_USER, request))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(taskRepository, never()).save(any());
        }

        @Test
        @DisplayName("빈 trades 생성 성공")
        void create_emptyTrades() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            CreateTaskRequest request = new CreateTaskRequest(
                    "company",
                    ProfileFactory.ADDRESS,
                    "taskTitle",
                    "eventTitle",
                    Set.of(),
                    START_DATE,
                    END_DATE
            );

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(taskRepository.save(any(TaskEntity.class))).thenAnswer(invocation -> {
                TaskEntity entity = invocation.getArgument(0);
                ReflectionTestUtils.setField(entity, "id", TASK_ID);
                ReflectionTestUtils.setField(entity, "createdAt", LocalDateTime.now());
                ReflectionTestUtils.setField(entity, "modifiedAt", LocalDateTime.now());
                return entity;
            });

            // when
            Task result = taskService.create(UserFactory.FOREMAN_USER, request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.trades()).isEmpty();
            verify(profileFinder).findByMemberId(USER_ID);
            verify(taskRepository).save(any(TaskEntity.class));
        }

        @Test
        @DisplayName("null trades 시 빈 Set")
        void create_nullTrades() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            CreateTaskRequest request = new CreateTaskRequest(
                    "company",
                    ProfileFactory.ADDRESS,
                    "taskTitle",
                    "eventTitle",
                    null,
                    START_DATE,
                    END_DATE
            );

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(taskRepository.save(any(TaskEntity.class))).thenAnswer(invocation -> {
                TaskEntity entity = invocation.getArgument(0);
                ReflectionTestUtils.setField(entity, "id", TASK_ID);
                ReflectionTestUtils.setField(entity, "createdAt", LocalDateTime.now());
                ReflectionTestUtils.setField(entity, "modifiedAt", LocalDateTime.now());
                return entity;
            });

            // when
            Task result = taskService.create(UserFactory.FOREMAN_USER, request);

            // then
            assertThat(result).isNotNull();
            assertThat(result.trades()).isEmpty();
            verify(profileFinder).findByMemberId(USER_ID);
            verify(taskRepository).save(any(TaskEntity.class));
        }
    }

    @Nested
    @DisplayName("TaskService.update")
    class UpdateTests {

        @Test
        @DisplayName("수정 성공")
        void update_success() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            UpdateTaskRequest request = TaskFactory.updateRequest();
            TaskEntity entity = TaskFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", TASK_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(entity));

            // when
            taskService.update(UserFactory.FOREMAN_USER, TASK_ID, request);

            // then
            assertThat(entity.getCompany()).isEqualTo("company");
            assertThat(entity.getTaskTitle()).isEqualTo("update");
            assertThat(entity.getEventTitle()).isEqualTo("update");
            verify(profileFinder).findByMemberId(USER_ID);
            verify(taskRepository).findById(TASK_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void update_notFound() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            UpdateTaskRequest request = TaskFactory.updateRequest();

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(taskRepository.findById(TASK_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> taskService.update(UserFactory.FOREMAN_USER, TASK_ID, request))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(taskRepository).findById(TASK_ID);
        }

        @Test
        @DisplayName("타인 수정 시 FORBIDDEN")
        void update_forbidden() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            UpdateTaskRequest request = TaskFactory.updateRequest();
            TaskEntity entity = TaskFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", TASK_ID);
            ReflectionTestUtils.setField(entity, "profileId", 999L); // Different profile

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> taskService.update(UserFactory.FOREMAN_USER, TASK_ID, request))
                    .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(taskRepository).findById(TASK_ID);
        }

        @Test
        @DisplayName("프로필 미존재 시 NOT_FOUND")
        void update_profileNotFound() {
            // given
            UpdateTaskRequest request = TaskFactory.updateRequest();

            when(profileFinder.findByMemberId(USER_ID))
                    .thenThrow(new CodeException(CommonExceptionCode.NOT_FOUND));

            // when & then
            assertCodeException(() -> taskService.update(UserFactory.FOREMAN_USER, TASK_ID, request))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(taskRepository, never()).findById(any());
        }
    }

    @Nested
    @DisplayName("TaskService.delete")
    class DeleteTests {

        @Test
        @DisplayName("삭제 성공")
        void delete_success() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            TaskEntity entity = TaskFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", TASK_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(entity));

            // when
            taskService.delete(UserFactory.FOREMAN_USER, TASK_ID);

            // then
            verify(profileFinder).findByMemberId(USER_ID);
            verify(taskRepository).findById(TASK_ID);
            verify(taskRepository).delete(entity);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void delete_notFound() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(taskRepository.findById(TASK_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> taskService.delete(UserFactory.FOREMAN_USER, TASK_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(taskRepository).findById(TASK_ID);
            verify(taskRepository, never()).delete(any());
        }

        @Test
        @DisplayName("타인 삭제 시 FORBIDDEN")
        void delete_forbidden() {
            // given
            Profile profile = ProfileFactory.create(PROFILE_ID, USER_ID);
            TaskEntity entity = TaskFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", TASK_ID);
            ReflectionTestUtils.setField(entity, "profileId", 999L); // Different profile

            when(profileFinder.findByMemberId(USER_ID)).thenReturn(profile);
            when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> taskService.delete(UserFactory.FOREMAN_USER, TASK_ID))
                    .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
            verify(profileFinder).findByMemberId(USER_ID);
            verify(taskRepository).findById(TASK_ID);
            verify(taskRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("TaskFinder.find")
    class TaskFinderFindTests {

        @Mock
        private TaskRepository finderTaskRepository;

        @InjectMocks
        private TaskFinder taskFinder;

        @Test
        @DisplayName("조회 성공")
        void find_success() {
            // given
            TaskEntity entity = TaskFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity, "id", TASK_ID);
            when(finderTaskRepository.findById(TASK_ID)).thenReturn(Optional.of(entity));

            // when
            Task result = taskFinder.find(TASK_ID);

            // then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(TASK_ID);
            assertThat(result.profileId()).isEqualTo(PROFILE_ID);
            verify(finderTaskRepository).findById(TASK_ID);
        }

        @Test
        @DisplayName("미존재 시 NOT_FOUND")
        void find_notFound() {
            // given
            when(finderTaskRepository.findById(TASK_ID)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> taskFinder.find(TASK_ID))
                    .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
            verify(finderTaskRepository).findById(TASK_ID);
        }
    }

    @Nested
    @DisplayName("TaskFinder.findByProfileId")
    class TaskFinderFindByProfileIdTests {

        @Mock
        private TaskRepository finderTaskRepository;

        @InjectMocks
        private TaskFinder taskFinder;

        @Test
        @DisplayName("조회 성공")
        void findAllByProfileId_success() {
            // given
            TaskEntity entity1 = TaskFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity1, "id", TASK_ID);
            TaskEntity entity2 = TaskFactory.createEntity(PROFILE_ID);
            ReflectionTestUtils.setField(entity2, "id", 101L);

            when(finderTaskRepository.findAllByProfileId(PROFILE_ID)).thenReturn(List.of(entity1, entity2));

            // when
            List<Task> result = taskFinder.findByProfileId(PROFILE_ID);

            // then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).id()).isEqualTo(TASK_ID);
            assertThat(result.get(1).id()).isEqualTo(101L);
            verify(finderTaskRepository).findAllByProfileId(PROFILE_ID);
        }

        @Test
        @DisplayName("빈 리스트 반환")
        void findAllByProfileId_empty() {
            // given
            when(finderTaskRepository.findAllByProfileId(PROFILE_ID)).thenReturn(List.of());

            // when
            List<Task> result = taskFinder.findByProfileId(PROFILE_ID);

            // then
            assertThat(result).isEmpty();
            verify(finderTaskRepository).findAllByProfileId(PROFILE_ID);
        }
    }
}
