package to.bconnect.api.oneclick.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.Instant;

// 키스콘 상습체불
@Entity
@Immutable
@Table(name = "kiscon_arrears")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class KisconArrearsEntity {

    @Id
    private Long id;

    private String seqNo;                  // 연번 (seq_no)

    private String companyName;            // 법인 명칭 (company_name)

    private String address;                // 법인 주소 (address)

    private String representative;         // 대표자 성명 (representative)

    private String representativeAge;      // 대표자 나이 (representative_age)

    private String representativeAddress;  // 대표자 주소 (representative_address)

    private String penaltyHistory;         // 처분이력 (penalty_history)

    private String penaltyDates;           // 처분일자 (penalty_dates)

    private String arrearsAmount;          // 체불금액, 단위 천원 (arrears_amount)

    private String publicationPeriod;      // 공표기간 (publication_period)

    private Instant syncedAt;              // 적재 시각 (synced_at)
}
