package to.bconnect.api.oneclick.domain.kiscon;

import java.time.LocalDate;

// 하도급 참여제한
public record SubcontractRestriction(
        String seqNo,                // 연번 (seq_no)
        String violationType,        // 위반법령 (violation_type)
        String companyName,          // 상호 (company_name)
        String corpNo,               // 법인번호 (corp_no)
        String bizRegNo,             // 사업자번호 (biz_reg_no)
        String representative,       // 대표자 (representative)
        LocalDate restrictionStart,  // 하도급참여제한 시작일 (restriction_start)
        LocalDate restrictionEnd,    // 하도급참여제한 종료일 (restriction_end)
        String category,             // 구분 (category)
        String announcementDate,     // 게재일 (announcement_date)
        String certificateUrl,       // 참여제한 확인서 다운로드 (certificate_url)
        String note                  // 비고 (note)
) {
}
