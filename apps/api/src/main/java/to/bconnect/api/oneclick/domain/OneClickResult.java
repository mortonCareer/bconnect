package to.bconnect.api.oneclick.domain;

import to.bconnect.api.oneclick.domain.cwma.RetirementFundResult;
import to.bconnect.api.oneclick.domain.ecic.ElectricalLicenseResult;
import to.bconnect.api.oneclick.domain.feia.FireLicenseResult;
import to.bconnect.api.oneclick.domain.kcomwel.InsuranceResult;
import to.bconnect.api.oneclick.domain.kiscon.HabitualArrearsResult;
import to.bconnect.api.oneclick.domain.kiscon.LicenseResult;
import to.bconnect.api.oneclick.domain.kiscon.SubcontractRestrictionResult;
import to.bconnect.api.oneclick.domain.moel.WageDefaultResult;
import to.bconnect.api.oneclick.domain.nts.BusinessStatusResult;

// 원클릭 조회 결과
public record OneClickResult(
        BusinessStatusResult businessStatus,
        LicenseResult generalLicense,
        LicenseResult specialtyLicense,
        InsuranceResult insurance,
        FireLicenseResult fireLicense,
        ElectricalLicenseResult electricalLicense,
        WageDefaultResult wageDefault,
        HabitualArrearsResult habitualArrears,
        SubcontractRestrictionResult subcontractRestriction,
        RetirementFundResult retirementFund
) {
}
