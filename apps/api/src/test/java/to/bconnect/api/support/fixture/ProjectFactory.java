package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.project.CreateProject;
import to.bconnect.api.core.domain.project.Project;
import to.bconnect.api.core.domain.project.UpdateProject;
import to.bconnect.api.storage.project.ProjectEntity;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class ProjectFactory {

    public static Project domain(Long id, Long companyId) {
        return new Project(id, companyId, "title", ProfileFactory.DEFAULT_ADDRESS, MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static ProjectEntity entity(Long companyId) {
        return new ProjectEntity(
                companyId,
                "title",
                ProfileFactory.DEFAULT_ADDRESS
        );
    }

    public static CreateProject createCommand() {
        return new CreateProject("create", ProfileFactory.DEFAULT_ADDRESS);
    }

    public static UpdateProject updateCommand() {
        return new UpdateProject("update", ProfileFactory.DEFAULT_ADDRESS);
    }
}
