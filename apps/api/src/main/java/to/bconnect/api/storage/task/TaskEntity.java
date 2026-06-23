package to.bconnect.api.storage.task;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.core.domain.task.UpdateAssigneeTask;
import to.bconnect.api.core.domain.task.UpdateProjectTask;
import to.bconnect.api.core.domain.task.UpdateWorkerTask;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.BaseEntity;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tasks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TaskEntity extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "dtype", nullable = false)
    private TaskType type;

    // TODO: MappingTableEntity 분리
    @ElementCollection(targetClass = Trade.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "task_trades", joinColumns = @JoinColumn(name = "task_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "trade")
    private Set<Trade> trades = new HashSet<>();

    @Column(name = "start_date", nullable = false)
    private LocalDate start;

    @Column(name = "end_date", nullable = false)
    private LocalDate end;

    // TODO: 생성 시 초기 상태 정책 확정
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.DRAFT;

    @Column
    private Long workerId;

    @Column(name = "worker_title")
    private String workerTitle;

    @Column(name = "worker_memo")
    private String workerMemo;

    @Column(name = "worker_company")
    private String workerCompany;

    @Embedded
    private Address address;

    @Column
    private Long projectId;

    @Column(name = "project_title")
    private String projectTitle;

    @Column(name = "project_requirement")
    private String projectRequirement;

    @Column(name = "project_memo")
    private String projectMemo;

    public TaskEntity(TaskType type, Set<Trade> trades, LocalDate start, LocalDate end,
                      Long workerId, String workerTitle, String workerMemo, String workerCompany, Address address,
                      Long projectId, String projectTitle, String projectRequirement, String projectMemo) {
        this.type = type;
        this.trades = trades != null ? trades : new HashSet<>();
        this.start = start;
        this.end = end;
        this.workerId = workerId;
        this.workerTitle = workerTitle;
        this.workerMemo = workerMemo;
        this.workerCompany = workerCompany;
        this.address = address;
        this.projectId = projectId;
        this.projectTitle = projectTitle;
        this.projectRequirement = projectRequirement;
        this.projectMemo = projectMemo;
    }

    public void update(UpdateWorkerTask command) {
        this.trades = command.trades() != null ? command.trades() : new HashSet<>();
        this.start = command.start();
        this.end = command.end();
        this.workerTitle = command.title();
        this.workerMemo = command.memo();
        this.workerCompany = command.company();
        this.address = command.address();
    }

    public void update(UpdateProjectTask command) {
        this.trades = command.trades() != null ? command.trades() : new HashSet<>();
        this.start = command.start();
        this.end = command.end();
        this.projectTitle = command.title();
        this.projectRequirement = command.requirement();
        this.projectMemo = command.memo();
    }

    public void update(UpdateAssigneeTask command) {
        this.workerTitle = command.title();
        this.workerMemo = command.memo();
    }
}
