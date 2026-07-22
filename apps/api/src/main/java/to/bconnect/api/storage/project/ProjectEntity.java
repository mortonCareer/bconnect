package to.bconnect.api.storage.project;

import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "projects")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectEntity extends BaseEntity {

    private Long companyId;

    private String title;

    @Embedded
    private Address address;

    public void update(String title, Address address) {
        this.title = title;
        this.address = address;
    }
}
