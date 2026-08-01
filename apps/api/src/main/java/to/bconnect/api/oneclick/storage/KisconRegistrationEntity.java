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
@Table(name = "kiscon_registration")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
// 키스콘 건설업 등록
public class KisconRegistrationEntity {

    @Id
    private Long ncrGsSeq;          // 공시 일련번호 (ncr_gs_seq)

    private String bizRegNo;        // 사업자등록번호 (biz_reg_no)

    private String companyName;     // 업체명 (company_name)

    private String representative;  // 대표자 (representative)

    private String tradeName;       // 업종명 (trade_name)

    private String tradeRegNo;      // 업종 등록번호 (trade_reg_no)

    private String address;         // 소재지 (address)

    private String region;          // 지역 (region)

    private String regionDetail;    // 지역 상세 (region_detail)

    private Integer regDate;        // 등록일자 (reg_date)

    private Integer announceDate;   // 공시일자 (announce_date)

    private String flag;            // 공시내용구분: 신규·정정·변경·철회 (flag)

    private String phone;           // 전화번호 (phone)

    private String announceNumber;  // 공고번호 (announce_number)

    private String announceReason;  // 공시사유 (announce_reason)

    private Instant syncedAt;       // 적재 시각 (synced_at)
}
