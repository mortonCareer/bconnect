package to.bconnect.api.crawler.storage;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public interface CrawledPostRepository extends JpaRepository<CrawledPostEntity, Long> {

    List<CrawledPostEntity> findByMemberId(Long memberId);

    default Map<Long, List<String>> findFirstImagesByMemberIdIn(Collection<Long> memberIds) {
        return findFirstImagesByMemberIdInRows(memberIds).stream()
                .collect(Collectors.groupingBy(
                        it -> ((Number) it[0]).longValue(),
                        LinkedHashMap::new,
                        Collectors.mapping(it -> (String) it[1], Collectors.toList())
                ));
    }

    @Query("SELECT p.memberId, img FROM CrawledPostEntity p JOIN p.images img "
            + "WHERE INDEX(img) = 0 AND p.memberId IN :memberIds "
            + "ORDER BY p.createdAt DESC, p.id DESC")
    List<Object[]> findFirstImagesByMemberIdInRows(@Param("memberIds") Collection<Long> memberIds);
}
