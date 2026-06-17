package to.bconnect.api.storage.project;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "projects")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectEntity extends BaseEntity {

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private String title;

    @Embedded
    private Address address;

    public ProjectEntity(Long companyId, String title, Address address) {
        this.companyId = companyId;
        this.title = title;
        this.address = address;
    }

    public void update(String title, Address address) {
        this.title = title;
        this.address = address;
    }
}
