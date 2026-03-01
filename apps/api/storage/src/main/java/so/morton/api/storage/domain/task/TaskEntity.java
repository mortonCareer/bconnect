package so.morton.api.storage.domain.task;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import so.morton.api.storage.support.Address;
import so.morton.api.storage.support.BaseEntity;
import so.morton.api.storage.value.Trade;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tasks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TaskEntity extends BaseEntity {

    @Column(nullable = false)
    private String company; // TODO: 삭제

    @Embedded
    private Address address; // TODO: 삭제

    // TODO: 추가
    // project_id: Long [nullable]
    // crew_id: Long [nullable]

    @Column(nullable = false)
    private String taskTitle;

    @Column(nullable = false)
    private String eventTitle;

    @ElementCollection(targetClass = Trade.class)
    @CollectionTable(name = "task_trades", joinColumns = @JoinColumn(name = "task_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "trade")
    private Set<Trade> trades = new HashSet<>();

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    // TODO: 추가
    // status: TaskStatus

    @Builder
    public TaskEntity(String company, Address address, String taskTitle, String eventTitle,
                      Set<Trade> trades, LocalDate startDate, LocalDate endDate) {
        this.company = company;
        this.address = address;
        this.taskTitle = taskTitle;
        this.eventTitle = eventTitle;
        this.trades = trades != null ? trades : new HashSet<>();
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public void update(String company, Address address, String taskTitle, String eventTitle,
                       Set<Trade> trades, LocalDate startDate, LocalDate endDate) {
        this.company = company;
        this.address = address;
        this.taskTitle = taskTitle;
        this.eventTitle = eventTitle;
        this.trades = trades != null ? trades : new HashSet<>();
        this.startDate = startDate;
        this.endDate = endDate;
    }
}
