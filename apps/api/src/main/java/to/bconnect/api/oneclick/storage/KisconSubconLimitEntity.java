package to.bconnect.api.oneclick.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

// 키스콘 하도급 참여제한
@Entity
@Immutable
@Table(name = "kiscon_subcon_limits")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class KisconSubconLimitEntity {

    @Id
    private Long id;

    private String bizRegNo;          // 사업자등록번호 (biz_reg_no)

    private String companyName;       // 상호명 (company_name)

    private String representative;    // 대표자 (representative)

    private String violationType;     // 위반유형 (violation_type)

    private String restrictionStart;  // 제한 시작 (restriction_start)

    private String restrictionEnd;    // 제한 종료 (restriction_end)
}
