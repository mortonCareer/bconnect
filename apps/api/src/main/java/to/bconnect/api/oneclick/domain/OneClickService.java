package to.bconnect.api.oneclick.domain;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.stereotype.Service;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.oneclick.OneClickUtils;
import to.bconnect.api.oneclick.domain.cwma.RetirementFundResult;
import to.bconnect.api.oneclick.domain.ecic.ElectricalLicenseResult;
import to.bconnect.api.oneclick.domain.feia.FireLicenseResult;
import to.bconnect.api.oneclick.domain.kcomwel.Insurance;
import to.bconnect.api.oneclick.domain.kcomwel.InsuranceResult;
import to.bconnect.api.oneclick.domain.kiscon.ConstructionBusinessType;
import to.bconnect.api.oneclick.domain.kiscon.Disposition;
import to.bconnect.api.oneclick.domain.kiscon.HabitualArrearsResult;
import to.bconnect.api.oneclick.domain.kiscon.License;
import to.bconnect.api.oneclick.domain.kiscon.LicenseResult;
import to.bconnect.api.oneclick.domain.kiscon.SubcontractRestriction;
import to.bconnect.api.oneclick.domain.kiscon.SubcontractRestrictionResult;
import to.bconnect.api.oneclick.domain.moel.WageDefaultResult;
import to.bconnect.api.oneclick.domain.nts.BusinessStatusResult;
import to.bconnect.api.oneclick.domain.nts.BusinessValidation;
import to.bconnect.api.oneclick.infrastructure.cwma.CwmaRetirementFundFinder;
import to.bconnect.api.oneclick.infrastructure.ecic.EcicElectricalLicenseFinder;
import to.bconnect.api.oneclick.infrastructure.feia.FeiaFireLicenseFinder;
import to.bconnect.api.oneclick.infrastructure.kcomwel.KcomwelInsuranceResolver;
import to.bconnect.api.oneclick.infrastructure.kiscon.KisconArrearsFinder;
import to.bconnect.api.oneclick.infrastructure.kiscon.KisconLicenseFinder;
import to.bconnect.api.oneclick.infrastructure.kiscon.KisconSubconFinder;
import to.bconnect.api.oneclick.infrastructure.moel.MoelWageDefaultFinder;
import to.bconnect.api.oneclick.infrastructure.nts.BusinessStatusResolver;
import to.bconnect.api.oneclick.infrastructure.nts.BusinessValidationResolver;
import to.bconnect.api.security.AuthUser;

import java.util.List;
import java.util.stream.Stream;

// 원클릭 조회 서비스
@Slf4j
@Service
@RequiredArgsConstructor
public class OneClickService {

    private final BusinessValidationResolver businessValidationResolver;
    private final BusinessStatusResolver businessStatusResolver;
    private final KisconLicenseFinder licenseFinder;
    private final KcomwelInsuranceResolver kcomwelInsuranceResolver;
    private final FeiaFireLicenseFinder feiaFireLicenseFinder;
    private final KisconSubconFinder kisconSubconFinder;
    private final KisconArrearsFinder kisconArrearsFinder;
    private final CwmaRetirementFundFinder cwmaRetirementFundFinder;
    private final EcicElectricalLicenseFinder ecicElectricalLicenseFinder;
    private final MoelWageDefaultFinder wageDefaultFinder;

    public OneClickResult lookup(AuthUser user, LookupOneClick command) {
        val validation = validate(command);
        if (!validation.valid())
            throw new CodeException(OneClickExceptionCode.VALIDATION_FAILED);

        val result = resolve(command);

        if (user != null) {
            // TODO(#892): 로그인 사용자 인증뱃지 발급 연동 (CredentialIssuer)
            log.info("one-click credential issuance pending. memberId={}", user.id());
        }

        return result;
    }

    private BusinessValidation validate(LookupOneClick command) {
        try {
            return businessValidationResolver.resolve(command.brn(), command.ownerName(), command.openedAt());
        } catch (RuntimeException e) {
            log.warn("business validation call failed. brn={}", command.brn(), e);
            throw new CodeException(OneClickExceptionCode.SERVICE_UNAVAILABLE);
        }
    }

    private OneClickResult resolve(LookupOneClick command) {
        val brn = command.brn();
        val ownerName = command.ownerName();

        BusinessStatusResult status;
        try {
            status = BusinessStatusResult.of(businessStatusResolver.resolve(brn));
        } catch (RuntimeException e) {
            log.warn("business status lookup failed. brn={}", brn, e);
            status = BusinessStatusResult.error();
        }

        Insurance insurance;
        try {
            insurance = kcomwelInsuranceResolver.resolve(brn);
        } catch (RuntimeException e) {
            log.warn("insurance lookup failed. brn={}", brn, e);
            insurance = Insurance.empty();
        }
        val insuredName = insurance.saeopjangNm();

        var licenses = List.<License>of();
        var dispositions = List.<Disposition>of();
        LicenseResult general;
        LicenseResult specialty;
        try {
            licenses = licenseFinder.listLicenses(brn, insuredName, ownerName);
            dispositions = licenseFinder.listDispositions(brn, insuredName, ownerName);
            general = LicenseResult.of(ConstructionBusinessType.GENERAL, licenses, dispositions);
            specialty = LicenseResult.of(ConstructionBusinessType.SPECIALTY, licenses, dispositions);
        } catch (RuntimeException e) {
            log.warn("license lookup failed. brn={}", brn, e);
            general = LicenseResult.error();
            specialty = LicenseResult.error();
        }

        var restrictions = List.<SubcontractRestriction>of();
        SubcontractRestrictionResult subcontractRestriction;
        try {
            restrictions = kisconSubconFinder.list(brn, insuredName, ownerName);
            subcontractRestriction = SubcontractRestrictionResult.of(restrictions);
        } catch (RuntimeException e) {
            log.warn("subcontract restriction lookup failed. brn={}", brn, e);
            subcontractRestriction = SubcontractRestrictionResult.error();
        }

        val companyName = companyName(insuredName, licenses, dispositions, restrictions);
        if (OneClickUtils.isBlank(companyName)) {
            log.info("company name unresolved. name based lookup skipped. brn={}", brn);
            return new OneClickResult(
                    status, general, specialty,
                    InsuranceResult.of(insurance),
                    FireLicenseResult.unknown(),
                    ElectricalLicenseResult.unknown(),
                    WageDefaultResult.unknown(),
                    HabitualArrearsResult.unknown(),
                    subcontractRestriction,
                    RetirementFundResult.unknown()
            );
        }

        ElectricalLicenseResult electricalLicense;
        try {
            electricalLicense = ElectricalLicenseResult.of(ecicElectricalLicenseFinder.list(companyName, ownerName));
        } catch (RuntimeException e) {
            log.warn("electrical license lookup failed. brn={}", brn, e);
            electricalLicense = ElectricalLicenseResult.error();
        }

        FireLicenseResult fireLicense;
        try {
            fireLicense = FireLicenseResult.of(feiaFireLicenseFinder.list(companyName, ownerName));
        } catch (RuntimeException e) {
            log.warn("fire license lookup failed. brn={}", brn, e);
            fireLicense = FireLicenseResult.error();
        }

        HabitualArrearsResult habitualArrears;
        try {
            habitualArrears = HabitualArrearsResult.of(kisconArrearsFinder.list(companyName, ownerName));
        } catch (RuntimeException e) {
            log.warn("habitual arrears lookup failed. brn={}", brn, e);
            habitualArrears = HabitualArrearsResult.error();
        }

        RetirementFundResult retirementFund;
        try {
            retirementFund = RetirementFundResult.of(cwmaRetirementFundFinder.list(companyName));
        } catch (RuntimeException e) {
            log.warn("retirement fund lookup failed. brn={}", brn, e);
            retirementFund = RetirementFundResult.error();
        }

        WageDefaultResult wageDefault;
        try {
            wageDefault = WageDefaultResult.of(wageDefaultFinder.list(companyName, ownerName));
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

    // 사업자등록번호 필드를 함께 가지는 소스에서 이름 기반 조회에 쓸 상호 추출
    private static String companyName(String insuredName,
                                      List<License> licenses,
                                      List<Disposition> dispositions,
                                      List<SubcontractRestriction> restrictions) {
        return Stream.of(
                        insuredName,
                        OneClickUtils.firstName(licenses, License::ncrGsKname),
                        OneClickUtils.firstName(dispositions, Disposition::ncrAdmiKname),
                        OneClickUtils.firstName(restrictions, SubcontractRestriction::companyName))
                .filter(it -> !OneClickUtils.isBlank(it))
                .findFirst()
                .orElse(null);
    }
}
