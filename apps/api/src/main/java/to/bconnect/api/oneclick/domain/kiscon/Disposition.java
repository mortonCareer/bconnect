package to.bconnect.api.oneclick.domain.kiscon;

import java.time.LocalDate;

// 행정처분
public record Disposition(
        Long ncrGsSeq,              // 공시 일련번호 (ncr_gs_seq)
        String ncrMasterNum,        // 사업자등록번호 (ncr_master_num)
        String ncrAdmiKname,        // 업체명 (ncr_admi_kname)
        String ncrAdmiMaster,       // 대표자 (ncr_admi_master)
        String ncrItemName,         // 업종명 (ncr_item_name)
        String ncrItemregno,        // 업종 등록번호 (ncr_itemregno)
        String ncrAdmiAddr,         // 소재지 (ncr_admi_addr)
        String ncrAreaName,         // 지역 (ncr_area_name)
        String ncrAreaDetailName,   // 지역 상세 (ncr_area_detail_name)
        String ncrAdmiDename,       // 처분내용 (ncr_admi_dename)
        String ecodeAdmiCon,        // 위반내용 (ecode_admi_con)
        String ncrAdmiReason,       // 위반 상세사유 (ncr_admi_reason)
        String ecodeAdmiGround,     // 처분근거 법조항 (ecode_admi_ground)
        Long ncrAdmiFine,           // 과징금 (ncr_admi_fine)
        Long ncrAdmiPenalty,        // 과태료 (ncr_admi_penalty)
        String ncrAdmiStopSdate,    // 영업정지 시작일 (ncr_admi_stop_sdate)
        String ncrAdmiStopEdate,    // 영업정지 종료일 (ncr_admi_stop_edate)
        String ncrAdmiCanceldate,   // 등록말소일자 (ncr_admi_canceldate)
        String ncrAdmiCorrect,      // 시정명령 내용 (ncr_admi_correct)
        LocalDate ncrGsDate,        // 처분일자 (ncr_gs_date)
        LocalDate ncrGsRegdate,     // 공시일자 (ncr_gs_regdate)
        String ncrGsFlag,           // 공시내용구분 (ncr_gs_flag)
        String ncrOffTel,           // 전화번호 (ncr_off_tel)
        String ncrPdStatus,         // 집행정지 여부 (ncr_pd_status)
        String ncrGsNumber,         // 공고번호 (ncr_gs_number)
        String ncrGsReason          // 공시사유 (ncr_gs_reason)
) {
    public ConstructionBusinessType type() {
        return ConstructionBusinessType.of(ncrItemName);
    }
}
