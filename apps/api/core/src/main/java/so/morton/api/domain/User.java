package so.morton.api.domain;

import so.morton.api.storage.entity.Address;
import so.morton.api.storage.entity.UserEntity;
import so.morton.api.storage.value.Role;
import so.morton.api.storage.value.Trade;

import java.time.LocalDateTime;
import java.util.Set;

public record User(
    Long id,
    String username,
    String name,
    String phone,
    String picture,
    Trade primaryTrade,
    Set<Trade> trades,
    int experience,
    Role role,
    String crew, // TODO: 삭제
    // crewId: Long [nullable] TODO: 추가
    String headline,
    String about,
    Address address,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static User of(UserEntity entity) {
        return new User(
                entity.getId(),
                entity.getUsername(),
                entity.getName(),
                entity.getPhone(),
                entity.getPicture(),
                entity.getPrimaryTrade(),
                entity.getTrades(),
                entity.getExperience(),
                entity.getRole(),
                entity.getCrew(),
                entity.getHeadline(),
                entity.getAbout(),
                entity.getAddress(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
