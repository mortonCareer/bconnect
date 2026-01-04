package so.morton.api.storage.repository;

import so.morton.api.storage.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import so.morton.api.storage.value.EntityStatus;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByUsername(String username);

    Optional<UserEntity> findByPhone(String phone);

    List<UserEntity> findAllByStatus(EntityStatus status);
}
