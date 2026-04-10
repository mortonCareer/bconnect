package so.morton.api.domain.chat;

import so.morton.api.storage.domain.chat.ParticipantEntity;

import java.time.LocalDateTime;

public record Participant(
    Long id,
    Long chatId,
    Long memberId,
    Long lastIdx,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Participant of(ParticipantEntity entity) {
        return new Participant(
                entity.getId(),
                entity.getChatId(),
                entity.getMemberId(),
                entity.getLastIdx(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
