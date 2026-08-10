package to.bconnect.api.core.domain.task;

import lombok.val;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.task.TaskProgress;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.TaskFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class TaskConcurrencyTest {

    @Autowired private TaskRepository taskRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private PlatformTransactionManager transactionManager;

    private TransactionTemplate outer;
    private TransactionTemplate inner;
    private Long memberId;
    private Long taskId;

    @BeforeEach
    void setUp() {
        outer = new TransactionTemplate(transactionManager);
        inner = new TransactionTemplate(transactionManager);
        inner.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        outer.executeWithoutResult(status -> {
            val member = memberRepository.save(MemberFactory.entity("concurrent", "01000007001", Role.CAREER));
            memberId = member.getId();
            taskId = taskRepository.save(TaskFactory.entity(member.getId())).getId();
        });
    }

    @AfterEach
    void tearDown() {
        outer.executeWithoutResult(status -> {
            taskRepository.findById(taskId).ifPresent(taskRepository::delete);
            memberRepository.findById(memberId).ifPresent(memberRepository::delete);
        });
    }

    @Test
    @DisplayName("동시 수정 - 다른 트랜잭션이 먼저 진행 상태를 바꾸면 낙관적 잠금 예외가 발생한다")
    void concurrentUpdate_optimisticLock() {
        assertThatThrownBy(() -> outer.executeWithoutResult(status -> {
            val stale = taskRepository.findById(taskId).orElseThrow();

            inner.executeWithoutResult(nested -> {
                val latest = taskRepository.findById(taskId).orElseThrow();
                latest.update(latest.getTrades(), latest.getStart(), latest.getEnd(), TaskProgress.COMPLETED,
                        latest.getWorkerTitle(), latest.getWorkerMemo(), latest.getWorkerCompany(), latest.getWorkerAddress());
            });

            stale.update(stale.getTrades(), stale.getStart(), stale.getEnd(), TaskProgress.IN_PROGRESS,
                    stale.getWorkerTitle(), stale.getWorkerMemo(), stale.getWorkerCompany(), stale.getWorkerAddress());
        })).isInstanceOf(ObjectOptimisticLockingFailureException.class);

        val found = outer.execute(status -> taskRepository.findById(taskId).orElseThrow());
        assertThat(found.getProgress()).isEqualTo(TaskProgress.COMPLETED);
    }

    @Test
    @DisplayName("순차 수정 - 트랜잭션이 겹치지 않으면 마지막 진행 상태가 반영된다")
    void sequentialUpdate_applied() {
        outer.executeWithoutResult(status -> {
            val task = taskRepository.findById(taskId).orElseThrow();
            task.update(task.getTrades(), task.getStart(), task.getEnd(), TaskProgress.IN_PROGRESS,
                    task.getWorkerTitle(), task.getWorkerMemo(), task.getWorkerCompany(), task.getWorkerAddress());
        });
        outer.executeWithoutResult(status -> {
            val task = taskRepository.findById(taskId).orElseThrow();
            task.update(task.getTrades(), task.getStart(), task.getEnd(), TaskProgress.COMPLETED,
                    task.getWorkerTitle(), task.getWorkerMemo(), task.getWorkerCompany(), task.getWorkerAddress());
        });

        val found = outer.execute(status -> taskRepository.findById(taskId).orElseThrow());
        assertThat(found.getProgress()).isEqualTo(TaskProgress.COMPLETED);
        assertThat(found.getVersion()).isEqualTo(2L);
    }
}
