package to.bconnect.api.oneclick.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.Instant;

// 고용노동부 체불사업주
@Entity
@Immutable
@Table(name = "moel_wage_defaults")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MoelWageDefaultEntity {

    @Id
    private Long id;

    private String period;          // 구분, 공표 회차 (period)

    private String name;            // 성명 (name)

    private String age;             // 나이 (age)

    private String companyName;     // 사업장명 (company_name)

    private String normalizedCompanyName;  // 정규화 사업장명 (normalized_company_name)

    private String industry;        // 업종 (industry)

    private String personalAddress; // 사업주 주소지 (personal_address)

    private String companyAddress;  // 사업장 소재지 (company_address)

    private String arrearsAmount;   // 체불액, 단위 원 (arrears_amount)

    private Instant syncedAt;       // 적재 시각 (synced_at)
}
