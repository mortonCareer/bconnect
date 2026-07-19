package to.bconnect.api.core.domain.project;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import to.bconnect.api.core.domain.company.CompanyCreatedEvent;

@Component
@RequiredArgsConstructor
public class ProjectEventListener {

    private final ProjectService projectService;

    @EventListener
    public void handleCompanyCreatedEvent(CompanyCreatedEvent event) {
        projectService.createDefault(event.companyId());
    }
}
