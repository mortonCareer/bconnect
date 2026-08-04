package to.bconnect.api.oneclick.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.Instant;

// 키스콘 하도급 참여제한
@Entity
@Immutable
@Table(name = "kiscon_subcon_limits")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class KisconSubconLimitEntity {

    @Id
    private Long id;

    private String seqNo;             // 연번 (seq_no)

    private String violationType;     // 위반법령 (violation_type)

    private String companyName;       // 상호 (company_name)

    private String normalizedCompanyName; // 정규화 상호 (normalized_company_name)

    private String corpNo;            // 법인번호 (corp_no)

    private String bizRegNo;          // 사업자번호 (biz_reg_no)

    private String representative;    // 대표자 (representative)

    private String restrictionStart;  // 하도급참여제한 시작일 (restriction_start)

    private String restrictionEnd;    // 하도급참여제한 종료일 (restriction_end)

    private String category;          // 구분 (category)

    private String announcementDate;  // 게재일 (announcement_date)

    private String certificateUrl;    // 참여제한 확인서 다운로드 (certificate_url)

    private String note;              // 비고 (note)

    private Instant syncedAt;         // 적재 시각 (synced_at)
}
