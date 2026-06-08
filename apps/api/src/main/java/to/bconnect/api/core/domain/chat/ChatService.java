package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.storage.chat.*;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.member.Member;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final MessageService messageService;
    private final MemberResolver memberResolver;
    private final ChatRepository chatRepository;
    private final ParticipantRepository participantRepository;
    private final MessageRepository messageRepository;

    @Transactional(readOnly = true)
    public List<Chat> list(Long memberId) {
        List<Long> chatIds = participantRepository.findByMemberId(memberId)
                .stream().map(ParticipantEntity::getChatId).toList();

        if (chatIds.isEmpty()) return List.of();

        List<ChatEntity> chats = chatRepository.findAllById(chatIds);

        Map<Long, List<Long>> participantIds = participantRepository.findByChatIdIn(chatIds)
                .stream()
                .collect(Collectors.groupingBy(
                        ParticipantEntity::getChatId,
                        Collectors.mapping(ParticipantEntity::getMemberId, Collectors.toList())
                ));

        Map<Long, Message> lastMessageMap = messageRepository.findLatestMessagesByChatIdIn(chatIds)
                .stream()
                .collect(Collectors.toMap(MessageEntity::getChatId, Message::of));

        Map<Long, Long> unreadCountMap = messageRepository
                .findUnreadCountByChatIdsAndMemberId(chatIds, memberId)
                .stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        List<Long> memberIds = participantIds.values().stream()
                .flatMap(List::stream)
                .distinct()
                .toList();

        Map<Long, Member> members = memberResolver.resolveMap(memberIds);

        return chats.stream()
                .map(chat -> new Chat(
                        chat.getId(),
                        chat.getTitle(),
                        participantIds.getOrDefault(chat.getId(), List.of()).stream()
                                .map(members::get)
                                .filter(Objects::nonNull)
                                .toList(),
                        lastMessageMap.get(chat.getId()),
                        unreadCountMap.getOrDefault(chat.getId(), 0L),
                        chat.getCreatedAt(),
                        chat.getModifiedAt()
                )).toList();
    }

    @Transactional
    public Long create(AuthUser user, CreateChat command) {
        List<Long> participantIds = command.participantIds().stream().distinct().toList();

        if (!participantIds.contains(user.id()))
            throw new CodeException(ChatExceptionCode.SELF_NOT_INCLUDED);

        List<Member> participants = memberResolver.findAllByIds(participantIds);

        if (participants.size() != participantIds.size())
            throw new CodeException(ChatExceptionCode.NOT_PARTICIPANT);

        ChatEntity chat = chatRepository.save(ChatEntity.builder()
                .title(command.title())
                .build());

        participantRepository.saveAll(participantIds.stream()
                .map(id -> ParticipantEntity.builder()
                        .chatId(chat.getId())
                        .memberId(id)
                        .build())
                .toList());

        messageRepository.save(MessageEntity.builder()
                .chatId(chat.getId())
                .memberId(Member.SYSTEM_ID)
                .type(MessageType.SYSTEM)
                .content(MessageTemplate.CHAT_CREATED)
                .build());

        return chat.getId();
    }

    @Transactional(readOnly = true)
    public CursorPage<Message> listMessages(AuthUser user, Long chatId, CursorLimit cursor) {
        if (!participantRepository.existsByChatIdAndMemberId(chatId, user.id()))
            throw new CodeException(ChatExceptionCode.NOT_PARTICIPANT);

        CursorLimit fetchCursor = new CursorLimit(
                cursor.cursor(),
                cursor.limit() + 1,
                cursor.reverse()
        );

        List<Message> messages = messageService.findAllByChatId(chatId, fetchCursor);

        boolean hasNext = messages.size() > cursor.limit();
        List<Message> content = hasNext ? messages.subList(0, cursor.limit()) : messages;
        Long nextCursor = hasNext ? content.getLast().id() : null;

        return new CursorPage<>(content, nextCursor, hasNext);
    }
}
