package to.bconnect.api.oneclick.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.oneclick.domain.nts.BusinessStatusResult;
import to.bconnect.api.oneclick.domain.ecic.ElectricalLicenseResult;
import to.bconnect.api.oneclick.domain.feia.FireLicenseResult;
import to.bconnect.api.oneclick.domain.kiscon.HabitualArrearsResult;
import to.bconnect.api.oneclick.domain.kcomwel.InsuranceResult;
import to.bconnect.api.oneclick.domain.kiscon.LicenseResult;
import to.bconnect.api.oneclick.domain.OneClickResult;
import to.bconnect.api.oneclick.domain.cwma.RetirementFundResult;
import to.bconnect.api.oneclick.domain.kiscon.SubcontractRestrictionResult;
import to.bconnect.api.oneclick.domain.nts.TaxpayerStatus;
import to.bconnect.api.oneclick.domain.Verdict;
import to.bconnect.api.oneclick.domain.moel.WageDefaultResult;

import java.time.LocalDate;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

// 원클릭 조회 응답
public record OneClickResponse(
        @Schema(requiredMode = REQUIRED) BusinessStatusResponse businessStatus,
        @Schema(requiredMode = REQUIRED) LicenseResponse generalLicense,
        @Schema(requiredMode = REQUIRED) LicenseResponse specialtyLicense,
        @Schema(requiredMode = REQUIRED) InsuranceResponse insurance,
        @Schema(requiredMode = REQUIRED) FireLicenseResponse fireLicense,
        @Schema(requiredMode = REQUIRED) ElectricalLicenseResponse electricalLicense,
        @Schema(requiredMode = REQUIRED) WageDefaultResponse wageDefault,
        @Schema(requiredMode = REQUIRED) HabitualArrearsResponse habitualArrears,
        @Schema(requiredMode = REQUIRED) SubcontractRestrictionResponse subcontractRestriction,
        @Schema(requiredMode = REQUIRED) RetirementFundResponse retirementFund
) {
    public static OneClickResponse of(OneClickResult result) {
        return new OneClickResponse(
                BusinessStatusResponse.of(result.businessStatus()),
                LicenseResponse.of(result.generalLicense()),
                LicenseResponse.of(result.specialtyLicense()),
                InsuranceResponse.of(result.insurance()),
                FireLicenseResponse.of(result.fireLicense()),
                ElectricalLicenseResponse.of(result.electricalLicense()),
                WageDefaultResponse.of(result.wageDefault()),
                HabitualArrearsResponse.of(result.habitualArrears()),
                SubcontractRestrictionResponse.of(result.subcontractRestriction()),
                RetirementFundResponse.of(result.retirementFund())
        );
    }

    // 사업자 상태 (국세청)
    public record BusinessStatusResponse(
            @Schema(requiredMode = REQUIRED) Verdict verdict,
            @Schema(requiredMode = REQUIRED) TaxpayerStatus taxpayerStatus,
            @Schema(requiredMode = REQUIRED, nullable = true) LocalDate closedAt
    ) {
        public static BusinessStatusResponse of(BusinessStatusResult result) {
            return new BusinessStatusResponse(result.verdict(), result.taxpayerStatus(), result.closedAt());
        }
    }

    // 건설업 면허 (키스콘)
    public record LicenseResponse(
            @Schema(requiredMode = REQUIRED) Verdict verdict,
            @Schema(requiredMode = REQUIRED) int count,
            @Schema(requiredMode = REQUIRED) List<String> tradeNames,
            @Schema(requiredMode = REQUIRED, nullable = true) LocalDate registeredAt,
            @Schema(requiredMode = REQUIRED) int dispositionCount
    ) {
        public static LicenseResponse of(LicenseResult result) {
            return new LicenseResponse(
                    result.verdict(), result.count(), result.tradeNames(),
                    result.registeredAt(), result.dispositionCount()
            );
        }
    }

    // 고용·산재보험 (근로복지공단)
    public record InsuranceResponse(
            @Schema(requiredMode = REQUIRED) Verdict verdict,
            @Schema(requiredMode = REQUIRED, nullable = true) String companyName,
            @Schema(requiredMode = REQUIRED, nullable = true) String industry,
            @Schema(requiredMode = REQUIRED, nullable = true) String workerCount,
            @Schema(requiredMode = REQUIRED, nullable = true) String establishedAt
    ) {
        public static InsuranceResponse of(InsuranceResult result) {
            return new InsuranceResponse(
                    result.verdict(), result.companyName(), result.industry(),
                    result.workerCount(), result.establishedAt()
            );
        }
    }

    // 소방시설업 면허 (소방청)
    public record FireLicenseResponse(
            @Schema(requiredMode = REQUIRED) Verdict verdict,
            @Schema(requiredMode = REQUIRED) int count,
            @Schema(requiredMode = REQUIRED, nullable = true) String companyName,
            @Schema(requiredMode = REQUIRED, nullable = true) String ceoName,
            @Schema(requiredMode = REQUIRED, nullable = true) String businessType,
            @Schema(requiredMode = REQUIRED, nullable = true) String licenseDiv
    ) {
        public static FireLicenseResponse of(FireLicenseResult result) {
            return new FireLicenseResponse(
                    result.verdict(), result.count(), result.companyName(),
                    result.ceoName(), result.businessType(), result.licenseDiv()
            );
        }
    }

    // 전기공사업 면허 (한국전기공사협회)
    public record ElectricalLicenseResponse(
            @Schema(requiredMode = REQUIRED) Verdict verdict,
            @Schema(requiredMode = REQUIRED) int count,
            @Schema(requiredMode = REQUIRED, nullable = true) String registrationNo,
            @Schema(requiredMode = REQUIRED, nullable = true) String companyName,
            @Schema(requiredMode = REQUIRED, nullable = true) String representative
    ) {
        public static ElectricalLicenseResponse of(ElectricalLicenseResult result) {
            return new ElectricalLicenseResponse(
                    result.verdict(), result.count(), result.registrationNo(),
                    result.companyName(), result.representative()
            );
        }
    }

    // 체불사업주 (고용노동부)
    public record WageDefaultResponse(
            @Schema(requiredMode = REQUIRED) Verdict verdict,
            @Schema(requiredMode = REQUIRED) int count,
            @Schema(requiredMode = REQUIRED, nullable = true) String name,
            @Schema(requiredMode = REQUIRED, nullable = true) String companyName,
            @Schema(requiredMode = REQUIRED, nullable = true) String arrearsAmount
    ) {
        public static WageDefaultResponse of(WageDefaultResult result) {
            return new WageDefaultResponse(
                    result.verdict(), result.count(), result.name(),
                    result.companyName(), result.arrearsAmount()
            );
        }
    }

    // 상습체불 (키스콘)
    public record HabitualArrearsResponse(
            @Schema(requiredMode = REQUIRED) Verdict verdict,
            @Schema(requiredMode = REQUIRED) int count,
            @Schema(requiredMode = REQUIRED, nullable = true) String companyName,
            @Schema(requiredMode = REQUIRED, nullable = true) String representative,
            @Schema(requiredMode = REQUIRED, nullable = true) String arrearsAmount,
            @Schema(requiredMode = REQUIRED, nullable = true) String publicationPeriod
    ) {
        public static HabitualArrearsResponse of(HabitualArrearsResult result) {
            return new HabitualArrearsResponse(
                    result.verdict(), result.count(), result.companyName(),
                    result.representative(), result.arrearsAmount(), result.publicationPeriod()
            );
        }
    }

    // 하도급 참여제한 (키스콘)
    public record SubcontractRestrictionResponse(
            @Schema(requiredMode = REQUIRED) Verdict verdict,
            @Schema(requiredMode = REQUIRED) int count,
            @Schema(requiredMode = REQUIRED, nullable = true) String companyName,
            @Schema(requiredMode = REQUIRED, nullable = true) String representative,
            @Schema(requiredMode = REQUIRED, nullable = true) String violationType,
            @Schema(requiredMode = REQUIRED, nullable = true) String restrictionStart,
            @Schema(requiredMode = REQUIRED, nullable = true) String restrictionEnd
    ) {
        public static SubcontractRestrictionResponse of(SubcontractRestrictionResult result) {
            return new SubcontractRestrictionResponse(
                    result.verdict(), result.count(), result.companyName(),
                    result.representative(), result.violationType(),
                    result.restrictionStart(), result.restrictionEnd()
            );
        }
    }

    // 퇴직공제 (건설근로자공제회)
    public record RetirementFundResponse(
            @Schema(requiredMode = REQUIRED) Verdict verdict,
            @Schema(requiredMode = REQUIRED) int count,
            @Schema(requiredMode = REQUIRED, nullable = true) String projectName,
            @Schema(requiredMode = REQUIRED, nullable = true) Long totalAmount,
            @Schema(requiredMode = REQUIRED, nullable = true) String startDate,
            @Schema(requiredMode = REQUIRED, nullable = true) String endDate,
            @Schema(requiredMode = REQUIRED, nullable = true) String clientOrg
    ) {
        public static RetirementFundResponse of(RetirementFundResult result) {
            return new RetirementFundResponse(
                    result.verdict(), result.count(), result.projectName(),
                    result.totalAmount(), result.startDate(), result.endDate(), result.clientOrg()
            );
        }
    }
}
