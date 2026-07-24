package to.bconnect.api.core.presentation.v1;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.attachment.domain.AttachmentKeyUtils;
import to.bconnect.api.attachment.domain.AttachmentResolver;
import to.bconnect.api.attachment.domain.ImageSize;
import to.bconnect.api.attachment.domain.SignedCookieIssuer;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.company.Company;
import to.bconnect.api.core.domain.company.CompanyService;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.presentation.v1.request.CreateCompanyRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateCompanyRequest;
import to.bconnect.api.core.presentation.v1.response.CompanyResponse;
import to.bconnect.api.core.presentation.v1.response.MemberSummaryResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.ReferenceType;

import java.util.List;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final MemberResolver memberResolver;
    private final AttachmentResolver attachmentResolver;
    private final SignedCookieIssuer signedCookieIssuer;

    @GetMapping
    public ApiResponse<List<CompanyResponse>> list(HttpServletResponse response) {
        val companies = companyService.list();
        val companyIds = companies.stream().map(Company::id).toList();
        val urlMap = attachmentResolver.resolveUrlMap(ReferenceType.COMPANY, companyIds, ImageSize.SMALL);
        val body = companies.stream()
                .map(it -> CompanyResponse.of(it, urlMap.get(it.id())))
                .toList();

        val scope = AttachmentKeyUtils.scope(AttachmentContext.COMPANY);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(body);
    }

    @GetMapping("/me")
    public ApiResponse<CompanyResponse> getMine(
            @AuthenticationPrincipal AuthUser user,
            HttpServletResponse response) {
        val company = companyService.get(user);
        val picture = attachmentResolver.getUrl(ReferenceType.COMPANY, company.id(), ImageSize.SMALL);

        val scope = AttachmentKeyUtils.scope(AttachmentContext.COMPANY);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(CompanyResponse.of(company, picture));
    }

    @GetMapping("/{id}")
    public ApiResponse<CompanyResponse> get(
            @PathVariable Long id,
            HttpServletResponse response) {
        val company = companyService.get(id);
        val picture = attachmentResolver.getUrl(ReferenceType.COMPANY, company.id(), ImageSize.SMALL);

        val scope = AttachmentKeyUtils.scope(AttachmentContext.COMPANY);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(CompanyResponse.of(company, picture));
    }

    @GetMapping("/{id}/members")
    public ApiResponse<List<MemberSummaryResponse>> listMembers(
            @PathVariable Long id,
            HttpServletResponse response) {
        val company = companyService.get(id);
        val member = memberResolver.find(company.memberId());
        val picture = attachmentResolver.getUrl(ReferenceType.MEMBER, member.id(), ImageSize.SMALL);

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(List.of(MemberSummaryResponse.of(member, picture)));
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateCompanyRequest request) {
        val id = companyService.create(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @PutMapping("/me")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid UpdateCompanyRequest request) {
        companyService.update(user, request.pictureId());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/me")
    public ApiResponse<Void> delete(@AuthenticationPrincipal AuthUser user) {
        companyService.delete(user);
        return ApiResponse.success(null);
    }
}
