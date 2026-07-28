package to.bconnect.api.oneclick.domain;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.stereotype.Service;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.oneclick.domain.cwma.RetirementFundResult;
import to.bconnect.api.oneclick.domain.ecic.ElectricalLicenseResult;
import to.bconnect.api.oneclick.domain.feia.FireLicenseResult;
import to.bconnect.api.oneclick.domain.kcomwel.Insurance;
import to.bconnect.api.oneclick.domain.kcomwel.InsuranceResult;
import to.bconnect.api.oneclick.domain.kiscon.ConstructionBusinessType;
import to.bconnect.api.oneclick.domain.kiscon.HabitualArrearsResult;
import to.bconnect.api.oneclick.domain.kiscon.LicenseResult;
import to.bconnect.api.oneclick.domain.kiscon.SubcontractRestrictionResult;
import to.bconnect.api.oneclick.domain.moel.WageDefaultResult;
import to.bconnect.api.oneclick.domain.nts.BusinessStatusResult;
import to.bconnect.api.oneclick.domain.nts.BusinessValidation;
import to.bconnect.api.oneclick.infrastructure.cwma.CwmaRetirementFinder;
import to.bconnect.api.oneclick.infrastructure.ecic.EcicElectricalLicenseFinder;
import to.bconnect.api.oneclick.infrastructure.feia.FeiaFireLicenseFinder;
import to.bconnect.api.oneclick.infrastructure.kcomwel.KcomwelInsuranceFinder;
import to.bconnect.api.oneclick.infrastructure.kiscon.KisconArrearsFinder;
import to.bconnect.api.oneclick.infrastructure.kiscon.KisconLicenseFinder;
import to.bconnect.api.oneclick.infrastructure.kiscon.KisconSubconFinder;
import to.bconnect.api.oneclick.infrastructure.moel.MoelWageDefaultFinder;
import to.bconnect.api.oneclick.infrastructure.nts.BusinessStatusFinder;
import to.bconnect.api.oneclick.infrastructure.nts.BusinessValidator;
import to.bconnect.api.security.AuthUser;

// 원클릭 조회 서비스
@Slf4j
@Service
@RequiredArgsConstructor
public class OneClickService {

    private final BusinessValidator businessValidator;
    private final BusinessStatusFinder businessStatusFinder;
    private final KisconLicenseFinder licenseFinder;
    private final KcomwelInsuranceFinder kcomwelInsuranceFinder;
    private final FeiaFireLicenseFinder feiaFireLicenseFinder;
    private final KisconSubconFinder kisconSubconFinder;
    private final KisconArrearsFinder kisconArrearsFinder;
    private final CwmaRetirementFinder cwmaRetirementFinder;
    private final EcicElectricalLicenseFinder ecicElectricalLicenseFinder;
    private final MoelWageDefaultFinder wageDefaultFinder;

    public OneClickResult lookup(AuthUser user, LookupOneClick command) {
        val validation = validate(command);
        if (!validation.valid())
            throw new CodeException(OneClickExceptionCode.VALIDATION_FAILED);

        val result = resolve(command);

        if (user != null) {
            // TODO(#892): 로그인 사용자 자격 증빙 발급 연동 (CredentialIssuer)
            log.info("one-click credential issuance pending. memberId={}", user.id());
        }

        return result;
    }

    private BusinessValidation validate(LookupOneClick command) {
        try {
            return businessValidator.check(command.brn(), command.ownerName(), command.openedAt());
        } catch (RuntimeException e) {
            log.warn("business validation call failed. brn={}", command.brn(), e);
            throw new CodeException(OneClickExceptionCode.SERVICE_UNAVAILABLE);
        }
    }

    private OneClickResult resolve(LookupOneClick command) {
        val brn = command.brn();

        BusinessStatusResult status;
        try {
            status = BusinessStatusResult.of(businessStatusFinder.resolve(brn));
        } catch (RuntimeException e) {
            log.warn("business status lookup failed. brn={}", brn, e);
            status = BusinessStatusResult.error();
        }

        LicenseResult general;
        LicenseResult specialty;
        try {
            val licenses = licenseFinder.listLicenses(brn);
            val dispositions = licenseFinder.listDispositions(brn);
            general = LicenseResult.of(ConstructionBusinessType.GENERAL, licenses, dispositions);
            specialty = LicenseResult.of(ConstructionBusinessType.SPECIALTY, licenses, dispositions);
        } catch (RuntimeException e) {
            log.warn("license lookup failed. brn={}", brn, e);
            general = LicenseResult.error();
            specialty = LicenseResult.error();
        }

        Insurance insurance;
        try {
            insurance = kcomwelInsuranceFinder.resolve(brn);
        } catch (RuntimeException e) {
            log.warn("insurance lookup failed. brn={}", brn, e);
            insurance = Insurance.empty();
        }
        val companyName = insurance.companyName();

        SubcontractRestrictionResult subcontractRestriction;
        try {
            subcontractRestriction = SubcontractRestrictionResult.of(kisconSubconFinder.list(brn));
        } catch (RuntimeException e) {
            log.warn("subcontract restriction lookup failed. brn={}", brn, e);
            subcontractRestriction = SubcontractRestrictionResult.error();
        }

        ElectricalLicenseResult electricalLicense;
        try {
            electricalLicense = ElectricalLicenseResult.of(ecicElectricalLicenseFinder.list(companyName));
        } catch (RuntimeException e) {
            log.warn("electrical license lookup failed. brn={}", brn, e);
            electricalLicense = ElectricalLicenseResult.error();
        }

        FireLicenseResult fireLicense;
        try {
            fireLicense = FireLicenseResult.of(feiaFireLicenseFinder.list(companyName));
        } catch (RuntimeException e) {
            log.warn("fire license lookup failed. brn={}", brn, e);
            fireLicense = FireLicenseResult.error();
        }

        HabitualArrearsResult habitualArrears;
        try {
            habitualArrears = HabitualArrearsResult.of(kisconArrearsFinder.list(companyName));
        } catch (RuntimeException e) {
            log.warn("habitual arrears lookup failed. brn={}", brn, e);
            habitualArrears = HabitualArrearsResult.error();
        }

        RetirementFundResult retirementFund;
        try {
            retirementFund = RetirementFundResult.of(cwmaRetirementFinder.list(companyName));
        } catch (RuntimeException e) {
            log.warn("retirement fund lookup failed. brn={}", brn, e);
            retirementFund = RetirementFundResult.error();
        }

        WageDefaultResult wageDefault;
        try {
            wageDefault = WageDefaultResult.of(wageDefaultFinder.list(companyName));
        } catch (RuntimeException e) {
            log.warn("wage default lookup failed. brn={}", brn, e);
            wageDefault = WageDefaultResult.error();
        }

        return new OneClickResult(
                status, general, specialty,
                InsuranceResult.of(insurance),
                fireLicense, electricalLicense, wageDefault, habitualArrears,
                subcontractRestriction, retirementFund
        );
    }
}
