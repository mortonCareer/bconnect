package so.morton.api.domain.member;

import so.morton.api.storage.support.Address;
import so.morton.api.storage.domain.member.MemberEntity;
import so.morton.api.storage.value.Role;
import so.morton.api.storage.value.Trade;

import java.time.LocalDateTime;
import java.util.Set;

public record Member(
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
    public void validate() {
        if (!trades.contains(primaryTrade)) {
            throw new IllegalArgumentException("주 직종은 보유 직종에 포함되어야 합니다");
        }
    }

    public static Member of(MemberEntity entity) {
        Member member = new Member(
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
        member.validate();
        return member;
    }
}
