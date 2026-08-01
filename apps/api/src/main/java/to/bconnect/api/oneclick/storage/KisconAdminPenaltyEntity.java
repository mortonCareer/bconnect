package to.bconnect.api.oneclick.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.Instant;

@Entity
@Immutable
@Table(name = "kiscon_admin_penalty")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
// 키스콘 행정처분
public class KisconAdminPenaltyEntity {

    @Id
    private Long ncrGsSeq;             // 공시 일련번호 (ncr_gs_seq)

    private String bizRegNo;           // 사업자등록번호 (biz_reg_no)

    private String companyName;        // 업체명 (company_name)

    private String representative;     // 대표자 (representative)

    private String tradeName;          // 업종명 (trade_name)

    private String tradeRegNo;         // 업종 등록번호 (trade_reg_no)

    private String address;            // 소재지 (address)

    private String region;             // 지역 (region)

    private String regionDetail;       // 지역 상세 (region_detail)

    private String penaltyType;        // 처분내용: 등록말소·영업정지·시정명령·과태료·과징금 (penalty_type)

    private String violationContent;   // 위반내용 (violation_content)

    private String violationDetail;    // 위반 상세사유 (violation_detail)

    private String penaltyGround;      // 처분근거 법조항 (penalty_ground)

    private Long fineAmount;           // 과징금 (fine_amount)

    private Long penaltyAmount;        // 과태료 (penalty_amount)

    private String stopStartDate;      // 영업정지 시작일 (stop_start_date)

    private String stopEndDate;        // 영업정지 종료일 (stop_end_date)

    private String cancelDate;         // 등록말소일자 (cancel_date)

    private String correction;         // 시정명령 내용 (correction)

    private Integer penaltyDate;       // 처분일자 (penalty_date)

    private Integer announceDate;      // 공시일자 (announce_date)

    private String flag;               // 공시내용구분: 신규·정정·변경·철회 (flag)

    private String phone;              // 전화번호 (phone)

    private String hasInjunction;      // 집행정지 여부: Y·N (has_injunction)

    private String announceNumber;     // 공고번호 (announce_number)

    private String announceReason;     // 공시사유 (announce_reason)

    private Instant syncedAt;          // 적재 시각 (synced_at)
}
