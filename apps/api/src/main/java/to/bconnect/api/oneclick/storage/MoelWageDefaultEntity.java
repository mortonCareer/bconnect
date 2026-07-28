package to.bconnect.api.oneclick.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

// 고용노동부 체불사업주
@Entity
@Immutable
@Table(name = "moel_wage_defaults")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MoelWageDefaultEntity {

    @Id
    private Long id;

    private String name;            // 성명 (name)

    private String companyName;     // 사업장명 (company_name)

    private String industry;        // 업종 (industry)

    private String arrearsAmount;   // 체불액 (arrears_amount)

    private String companyAddress;  // 소재지 (company_address)
}
