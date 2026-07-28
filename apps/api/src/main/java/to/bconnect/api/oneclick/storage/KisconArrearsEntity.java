package to.bconnect.api.oneclick.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

// 키스콘 상습체불
@Entity
@Immutable
@Table(name = "kiscon_arrears")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class KisconArrearsEntity {

    @Id
    private Long id;

    private String companyName;        // 업체명 (company_name)

    private String representative;     // 대표자 (representative)

    private String arrearsAmount;      // 체불금액 (arrears_amount)

    private String penaltyHistory;     // 처분이력 (penalty_history)

    private String publicationPeriod;  // 공표기간 (publication_period)
}
