package to.bconnect.api.oneclick.domain.kiscon;

import java.time.LocalDate;

// 건설업 면허
public record License(
        Long ncrGsSeq,              // 공시 일련번호 (ncr_gs_seq)
        String ncrMasterNum,        // 사업자등록번호 (ncr_master_num)
        String ncrGsKname,          // 업체명 (ncr_gs_kname)
        String ncrGsMaster,         // 대표자 (ncr_gs_master)
        String ncrItemName,         // 업종명 (ncr_item_name)
        String ncrItemregno,        // 업종 등록번호 (ncr_itemregno)
        String ncrGsAddr,           // 소재지 (ncr_gs_addr)
        String ncrAreaName,         // 지역 (ncr_area_name)
        String ncrAreaDetailName,   // 지역 상세 (ncr_area_detail_name)
        LocalDate ncrGsDate,        // 등록일자 (ncr_gs_date)
        LocalDate ncrGsRegdate,     // 공시일자 (ncr_gs_regdate)
        String ncrGsFlag,           // 공시내용구분 (ncr_gs_flag)
        String ncrOffTel,           // 전화번호 (ncr_off_tel)
        String ncrGsNumber,         // 공고번호 (ncr_gs_number)
        String ncrGsReason          // 공시사유 (ncr_gs_reason)
) {
    public ConstructionBusinessType type() {
        return ConstructionBusinessType.of(ncrItemName);
    }
}
