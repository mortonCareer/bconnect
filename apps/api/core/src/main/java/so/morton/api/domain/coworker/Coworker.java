package so.morton.api.domain.coworker;

import so.morton.api.storage.domain.coworker.CoworkerEntity;
import so.morton.api.storage.value.CoworkerStatus;

import java.time.LocalDateTime;

public record Coworker(
    Long id,
    Long fromId,
    Long toId,
    String pair,
    CoworkerStatus status,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Coworker of(CoworkerEntity entity) {
        return new Coworker(
                entity.getId(),
                entity.getFromId(),
                entity.getToId(),
                entity.getPair(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
