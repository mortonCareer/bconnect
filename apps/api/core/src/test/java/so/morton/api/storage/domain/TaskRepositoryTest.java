package so.morton.api.storage.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.persistence.EntityManager;
import so.morton.api.config.UnitTest;
import so.morton.api.storage.domain.task.TaskEntity;
import so.morton.api.storage.domain.task.TaskRepository;
import so.morton.api.storage.value.Trade;
import so.morton.api.support.fixture.ProfileFactory;
import so.morton.api.support.fixture.TaskFactory;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@UnitTest
@DisplayName("TaskRepository 테스트")
class TaskRepositoryTest {

    @Autowired private TaskRepository taskRepository;
    @Autowired private EntityManager entityManager;

    private static final Long PROFILE_ID = 1L;
    private static final LocalDate START_DATE = LocalDate.of(2024, 1, 1);
    private static final LocalDate END_DATE = LocalDate.of(2024, 12, 31);

    private TaskEntity createTestEntityWithTrades(Set<Trade> trades) {
        return TaskEntity.builder()
                .profileId(PROFILE_ID)
                .company("company")
                .address(ProfileFactory.ADDRESS)
                .taskTitle("task")
                .eventTitle("event")
                .trades(trades)
                .start(START_DATE)
                .end(END_DATE)
                .build();
    }

    @Nested
    @DisplayName("TaskRepository.save & findById")
    class SaveAndFindByIdTests {

        @Test
        @DisplayName("저장 후 조회 성공")
        void save_and_findById() {
            // given
            TaskEntity entity = TaskFactory.createEntity(PROFILE_ID);

            // when
            TaskEntity saved = taskRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            Optional<TaskEntity> found = taskRepository.findById(saved.getId());

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getId()).isEqualTo(saved.getId());
            assertThat(found.get().getCompany()).isEqualTo("company");
            assertThat(found.get().getTaskTitle()).isEqualTo("task");
            assertThat(found.get().getEventTitle()).isEqualTo("event");
            assertThat(found.get().getStart()).isEqualTo(START_DATE);
            assertThat(found.get().getEnd()).isEqualTo(END_DATE);
        }

        @Test
        @DisplayName("미존재 시 빈 Optional")
        void findById_notExists() {
            // when
            Optional<TaskEntity> found = taskRepository.findById(999L);

            // then
            assertThat(found).isEmpty();
        }
    }

    @Nested
    @DisplayName("TaskRepository.findAll")
    class FindAllTests {

        @Test
        @DisplayName("빈 DB 시 빈 리스트")
        void findAll_empty() {
            // when
            List<TaskEntity> result = taskRepository.findAll();

            // then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("복수 저장 후 전체 조회")
        void findAll_withData() {
            // given
            TaskEntity entity1 = TaskFactory.createEntity(PROFILE_ID);
            TaskEntity entity2 = TaskEntity.builder()
                    .profileId(2L)
                    .company("company2")
                    .address(ProfileFactory.ADDRESS)
                    .taskTitle("task2")
                    .eventTitle("event2")
                    .trades(Set.of(Trade.DEMOLITION))
                    .start(LocalDate.of(2025, 1, 1))
                    .end(LocalDate.of(2025, 12, 31))
                    .build();

            taskRepository.save(entity1);
            taskRepository.save(entity2);
            entityManager.flush();
            entityManager.clear();

            // when
            List<TaskEntity> result = taskRepository.findAll();

            // then
            assertThat(result).hasSize(2);
            assertThat(result).extracting(TaskEntity::getCompany)
                    .containsExactlyInAnyOrder("company", "company2");
        }
    }

    @Nested
    @DisplayName("TaskRepository.findAllByProfileId")
    class FindAllByProfileIdTests {

        @Test
        @DisplayName("profileId 조회 성공")
        void findAllByProfileId_success() {
            // given
            TaskEntity entity = TaskFactory.createEntity(PROFILE_ID);
            taskRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            // when
            List<TaskEntity> result = taskRepository.findAllByProfileId(PROFILE_ID);

            // then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getProfileId()).isEqualTo(PROFILE_ID);
        }

        @Test
        @DisplayName("미존재 profileId 시 빈 리스트")
        void findAllByProfileId_notExists() {
            // given
            TaskEntity entity = TaskFactory.createEntity(PROFILE_ID);
            taskRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            // when
            List<TaskEntity> result = taskRepository.findAllByProfileId(999L);

            // then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("동일 profileId 복수 조회")
        void findAllByProfileId_multiple() {
            // given
            TaskEntity entity1 = TaskFactory.createEntity(PROFILE_ID);
            TaskEntity entity2 = TaskEntity.builder()
                    .profileId(PROFILE_ID)
                    .company("company2")
                    .address(ProfileFactory.ADDRESS)
                    .taskTitle("task2")
                    .eventTitle("event2")
                    .trades(Set.of(Trade.ELECTRICAL))
                    .start(LocalDate.of(2024, 6, 15))
                    .end(LocalDate.of(2024, 12, 31))
                    .build();

            taskRepository.save(entity1);
            taskRepository.save(entity2);
            entityManager.flush();
            entityManager.clear();

            // when
            List<TaskEntity> result = taskRepository.findAllByProfileId(PROFILE_ID);

            // then
            assertThat(result).hasSize(2);
            assertThat(result).extracting(TaskEntity::getCompany)
                    .containsExactlyInAnyOrder("company", "company2");
        }
    }

    @Nested
    @DisplayName("TaskRepository soft-delete behavior")
    class SoftDeleteTests {

        @Test
        @DisplayName("삭제 후 findAll 제외")
        void softDelete_excludeFromFindAll() {
            // given
            TaskEntity entity = TaskFactory.createEntity(PROFILE_ID);
            TaskEntity saved = taskRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            // when
            taskRepository.delete(saved);
            entityManager.flush();
            entityManager.clear();

            List<TaskEntity> result = taskRepository.findAll();

            // then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("삭제 후 findById 제외")
        void softDelete_excludeFromFindById() {
            // given
            TaskEntity entity = TaskFactory.createEntity(PROFILE_ID);
            TaskEntity saved = taskRepository.save(entity);
            Long savedId = saved.getId();
            entityManager.flush();
            entityManager.clear();

            // when
            taskRepository.delete(saved);
            entityManager.flush();
            entityManager.clear();

            Optional<TaskEntity> found = taskRepository.findById(savedId);

            // then
            assertThat(found).isEmpty();
        }

        @Test
        @DisplayName("하나 삭제 시 나머지 유지")
        void softDelete_multipleEntities() {
            // given
            TaskEntity entity1 = TaskFactory.createEntity(1L);
            TaskEntity entity2 = TaskFactory.createEntity(2L);

            TaskEntity saved1 = taskRepository.save(entity1);
            TaskEntity saved2 = taskRepository.save(entity2);
            entityManager.flush();
            entityManager.clear();

            // when
            taskRepository.delete(saved1);
            entityManager.flush();
            entityManager.clear();

            List<TaskEntity> result = taskRepository.findAll();

            // then
            assertThat(result).hasSize(1);
            assertThat(result.getFirst().getId()).isEqualTo(saved2.getId());
        }
    }

    @Nested
    @DisplayName("TaskRepository @ElementCollection trades")
    class ElementCollectionTradesTests {

        @Test
        @DisplayName("trades 저장 후 조회")
        void save_withTrades_elementCollection() {
            // given
            Set<Trade> trades = Set.of(Trade.DESIGN, Trade.DEMOLITION, Trade.ELECTRICAL);
            TaskEntity entity = createTestEntityWithTrades(trades);

            // when
            TaskEntity saved = taskRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            Optional<TaskEntity> found = taskRepository.findById(saved.getId());

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getTrades()).hasSize(3);
            assertThat(found.get().getTrades()).containsExactlyInAnyOrder(
                    Trade.DESIGN,
                    Trade.DEMOLITION,
                    Trade.ELECTRICAL
            );
        }

        @Test
        @DisplayName("빈 trades 저장")
        void save_withEmptyTrades() {
            // given
            TaskEntity entity = createTestEntityWithTrades(new HashSet<>());

            // when
            TaskEntity saved = taskRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            Optional<TaskEntity> found = taskRepository.findById(saved.getId());

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getTrades()).isEmpty();
        }

        @Test
        @DisplayName("flush/clear 후 trades 접근")
        void lazyInit_trades_afterClear() {
            // given
            Set<Trade> trades = Set.of(Trade.DESIGN, Trade.PLUMBING);
            TaskEntity entity = createTestEntityWithTrades(trades);

            // when
            TaskEntity saved = taskRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            Optional<TaskEntity> found = taskRepository.findById(saved.getId());

            // then - accessing trades should not throw LazyInitializationException
            // because we're still within the transaction
            assertThat(found).isPresent();
            assertThat(found.get().getTrades()).hasSize(2);
            assertThat(found.get().getTrades()).containsExactlyInAnyOrder(
                    Trade.DESIGN,
                    Trade.PLUMBING
            );
        }

        @Test
        @DisplayName("단일 trade 저장")
        void save_withSingleTrade() {
            // given
            TaskEntity entity = createTestEntityWithTrades(Set.of(Trade.CARPENTRY));

            // when
            TaskEntity saved = taskRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            Optional<TaskEntity> found = taskRepository.findById(saved.getId());

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getTrades()).hasSize(1);
            assertThat(found.get().getTrades()).contains(Trade.CARPENTRY);
        }
    }

    @Nested
    @DisplayName("TaskRepository address @Embedded")
    class EmbeddedAddressTests {

        @Test
        @DisplayName("Address 저장 후 조회")
        void save_withAddress() {
            // given
            TaskEntity entity = TaskFactory.createEntity(PROFILE_ID);

            // when
            TaskEntity saved = taskRepository.save(entity);
            entityManager.flush();
            entityManager.clear();

            Optional<TaskEntity> found = taskRepository.findById(saved.getId());

            // then
            assertThat(found).isPresent();
            assertThat(found.get().getAddress()).isNotNull();
            assertThat(found.get().getAddress().getZipcode()).isEqualTo(ProfileFactory.ADDRESS.getZipcode());
        }
    }
}
