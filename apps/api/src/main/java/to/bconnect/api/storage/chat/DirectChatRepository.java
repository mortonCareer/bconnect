package to.bconnect.api.storage.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DirectChatRepository extends JpaRepository<DirectChatEntity, Long> {

    default Optional<DirectChatEntity> findByMembers(Long memberId, Long otherId) {
        return findByMinIdAndMaxId(Math.min(memberId, otherId), Math.max(memberId, otherId));
    }

    Optional<DirectChatEntity> findByMinIdAndMaxId(Long minId, Long maxId);

    default List<DirectChatEntity> findAllByMember(Long memberId) {
        return findAllByMinIdOrMaxId(memberId, memberId);
    }

    List<DirectChatEntity> findAllByMinIdOrMaxId(Long minId, Long maxId);

    default boolean existsByIdAndMember(Long id, Long memberId) {
        return existsByIdAndMinIdOrIdAndMaxId(id, memberId, id, memberId);
    }

    boolean existsByIdAndMinIdOrIdAndMaxId(Long id, Long minId, Long id2, Long maxId);
}
