package to.bconnect.api.storage.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {

    List<ProjectEntity> findAllByCompanyId(Long companyId);

    long countByCompanyId(Long companyId);
}
