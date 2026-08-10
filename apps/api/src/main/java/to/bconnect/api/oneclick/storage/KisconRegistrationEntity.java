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
    private Long ncrGsSeq;              // 공시 일련번호 (ncr_gs_seq)

    private String ncrMasterNum;        // 사업자등록번호 (ncr_master_num)

    private String ncrGsKname;          // 업체명 (ncr_gs_kname)

    private String normalizedCompanyName; // 정규화 업체명 (normalized_company_name)

    private String ncrGsMaster;         // 대표자 (ncr_gs_master)

    private String ncrItemName;         // 업종명 (ncr_item_name)

    private String ncrItemregno;        // 업종 등록번호 (ncr_itemregno)

    private String ncrGsAddr;           // 소재지 (ncr_gs_addr)

    private String ncrAreaName;         // 지역 (ncr_area_name)

    private String ncrAreaDetailName;   // 지역 상세 (ncr_area_detail_name)

    private Integer ncrGsDate;          // 등록일자 (ncr_gs_date)

    private Integer ncrGsRegdate;       // 공시일자 (ncr_gs_regdate)

    private String ncrGsFlag;           // 공시내용구분: 신규·정정·변경·철회 (ncr_gs_flag)

    private String ncrOffTel;           // 전화번호 (ncr_off_tel)

    private String ncrGsNumber;         // 공고번호 (ncr_gs_number)

    private String ncrGsReason;         // 공시사유 (ncr_gs_reason)

    private Instant syncedAt;           // 적재 시각 (synced_at)
}
