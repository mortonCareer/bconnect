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
    private Long ncrGsSeq;              // 공시 일련번호 (ncr_gs_seq)

    private String ncrMasterNum;        // 사업자등록번호 (ncr_master_num)

    private String ncrAdmiKname;        // 업체명 (ncr_admi_kname)

    private String normalizedCompanyName; // 정규화 업체명 (normalized_company_name)

    private String ncrAdmiMaster;       // 대표자 (ncr_admi_master)

    private String ncrItemName;         // 업종명 (ncr_item_name)

    private String ncrItemregno;        // 업종 등록번호 (ncr_itemregno)

    private String ncrAdmiAddr;         // 소재지 (ncr_admi_addr)

    private String ncrAreaName;         // 지역 (ncr_area_name)

    private String ncrAreaDetailName;   // 지역 상세 (ncr_area_detail_name)

    private String ncrAdmiDename;       // 처분내용: 등록말소·영업정지·시정명령·과태료·과징금 (ncr_admi_dename)

    private String ecodeAdmiCon;        // 위반내용 (ecode_admi_con)

    private String ncrAdmiReason;       // 위반 상세사유 (ncr_admi_reason)

    private String ecodeAdmiGround;     // 처분근거 법조항 (ecode_admi_ground)

    private Long ncrAdmiFine;           // 과징금 (ncr_admi_fine)

    private Long ncrAdmiPenalty;        // 과태료 (ncr_admi_penalty)

    private String ncrAdmiStopSdate;    // 영업정지 시작일 (ncr_admi_stop_sdate)

    private String ncrAdmiStopEdate;    // 영업정지 종료일 (ncr_admi_stop_edate)

    private String ncrAdmiCanceldate;   // 등록말소일자 (ncr_admi_canceldate)

    private String ncrAdmiCorrect;      // 시정명령 내용 (ncr_admi_correct)

    private Integer ncrGsDate;          // 처분일자 (ncr_gs_date)

    private Integer ncrGsRegdate;       // 공시일자 (ncr_gs_regdate)

    private String ncrGsFlag;           // 공시내용구분: 신규·정정·변경·철회 (ncr_gs_flag)

    private String ncrOffTel;           // 전화번호 (ncr_off_tel)

    private String ncrPdStatus;         // 집행정지 여부: Y·N (ncr_pd_status)

    private String ncrGsNumber;         // 공고번호 (ncr_gs_number)

    private String ncrGsReason;         // 공시사유 (ncr_gs_reason)

    private Instant syncedAt;           // 적재 시각 (synced_at)
}
