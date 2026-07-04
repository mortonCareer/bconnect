package to.bconnect.api.storage.task;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
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
    @Column(name = "dtype")
    private TaskType type;

    @ElementCollection(targetClass = Trade.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "task_trades", joinColumns = @JoinColumn(name = "task_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "trade")
    private Set<Trade> trades = new HashSet<>();

    @Column(name = "start_date")
    private LocalDate start;

    @Column(name = "end_date")
    private LocalDate end;

    @Enumerated(EnumType.STRING)
    private TaskStatus status = TaskStatus.DRAFT;

    private Long workerId;

    @Column(name = "worker_title")
    private String workerTitle;

    @Column(name = "worker_memo")
    private String workerMemo;

    @Column(name = "worker_company")
    private String workerCompany;

    @Embedded
    private Address address;

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

    public void update(Set<Trade> trades, LocalDate start, LocalDate end,
                       String title, String memo, String company, Address address) {
        this.trades = trades != null ? trades : new HashSet<>();
        this.start = start;
        this.end = end;
        this.workerTitle = title;
        this.workerMemo = memo;
        this.workerCompany = company;
        this.address = address;
    }

    public void update(Set<Trade> trades, LocalDate start, LocalDate end,
                       String title, String requirement, String memo) {
        this.trades = trades != null ? trades : new HashSet<>();
        this.start = start;
        this.end = end;
        this.projectTitle = title;
        this.projectRequirement = requirement;
        this.projectMemo = memo;
    }

    public void update(String title, String memo) {
        this.workerTitle = title;
        this.workerMemo = memo;
    }

    public void assign(Long workerId) {
        this.workerId = workerId;
        this.status = TaskStatus.SCHEDULED;
    }
}
