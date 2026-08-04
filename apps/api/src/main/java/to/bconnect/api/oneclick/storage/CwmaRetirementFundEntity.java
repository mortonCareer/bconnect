package to.bconnect.api.oneclick.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

// 건설근로자공제회 퇴직공제 가입 공사
@Entity
@Immutable
@Table(name = "cwma_retirement_fund")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CwmaRetirementFundEntity {

    @Id
    private Long id;

    private Integer seqNo;                 // 연번 (seq_no)

    private String projectName;            // 공사명 (project_name)

    private BigDecimal totalAmount;        // 총공사금액, 단위 억원 (total_amount)

    private LocalDate startDate;           // 공사시작일 (start_date)

    private LocalDate endDate;             // 공사종료일 (end_date)

    private String companyName;            // 업체명 (company_name)

    private String normalizedCompanyName;  // 정규화 업체명 (normalized_company_name)

    private String clientOrg;              // 수요기관 (client_org)

    private String address;                // 소재지주소 (address)

    private Instant syncedAt;              // 적재 시각 (synced_at)
}
