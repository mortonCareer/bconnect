package to.bconnect.api.storage.company;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "companies")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CompanyEntity extends BaseEntity {

    @Column(nullable = false, unique = true)
    private Long memberId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String brn;

    @Column
    private Long pictureId;

    public CompanyEntity(Long memberId, String name, String brn, Long pictureId) {
        this.memberId = memberId;
        this.name = name;
        this.brn = brn;
        this.pictureId = pictureId;
    }

    public void update(Long pictureId) {
        this.pictureId = pictureId;
    }
}
