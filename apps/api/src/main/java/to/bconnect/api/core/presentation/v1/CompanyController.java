package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.core.domain.company.Company;
import to.bconnect.api.core.domain.company.CompanyService;
import to.bconnect.api.core.presentation.v1.request.CreateCompanyRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateCompanyRequest;
import to.bconnect.api.core.presentation.v1.response.CompanyResponse;
import to.bconnect.api.security.AuthUser;

import java.util.List;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final MemberResolver memberResolver;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ApiResponse<List<CompanyResponse>> list() {
        val companies = companyService.list();
        val memberIds = companies.stream().map(Company::memberId).distinct().toList();
        val memberMap = memberResolver.resolveMap(memberIds);

        val response = companies.stream()
                .map(it -> CompanyResponse.of(it, memberMap.get(it.memberId())))
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<CompanyResponse> get(@PathVariable Long id) {
        val company = companyService.get(id);
        val member = memberResolver.find(company.memberId());
        return ApiResponse.success(CompanyResponse.of(company, member));
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
        companyService.update(user, request.picture());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/me")
    public ApiResponse<Void> delete(@AuthenticationPrincipal AuthUser user) {
        companyService.delete(user);
        return ApiResponse.success(null);
    }
}
