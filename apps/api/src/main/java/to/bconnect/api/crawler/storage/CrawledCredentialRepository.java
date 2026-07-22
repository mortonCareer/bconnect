package to.bconnect.api.crawler.storage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CrawledCredentialRepository extends JpaRepository<CrawledCredentialEntity, Long> {

    List<CrawledCredentialEntity> findByMemberId(Long memberId);
}
