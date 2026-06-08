package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Window;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

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

        Map<Long, List<Long>> participantMap = participantRepository.findByChatIdIn(chatIds)
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

        return chats.stream()
                .map(chat -> Chat.of(
                        chat,
                        participantMap.getOrDefault(chat.getId(), List.of()),
                        lastMessageMap.get(chat.getId()),
                        unreadCountMap.getOrDefault(chat.getId(), 0L)
                )).toList();
    }

    @Transactional
    public Long create(AuthUser user, CreateChat command) {
        List<Long> participantIds = command.participantIds().stream().distinct().toList();

        if (!participantIds.contains(user.id()))
            throw new CodeException(ChatExceptionCode.SELF_NOT_INCLUDED);

        ChatEntity created = chatRepository.save(new ChatEntity(command.title()));

        participantRepository.saveAll(participantIds.stream()
                .map(id -> ParticipantEntity.builder()
                        .chatId(created.getId())
                        .memberId(id)
                        .build())
                .toList());

        messageRepository.save(new MessageEntity(
                created.getId(),
                Member.SYSTEM_ID,
                MessageType.SYSTEM,
                MessageTemplate.CHAT_CREATED
        ));

        return created.getId();
    }

    @Transactional(readOnly = true)
    public CursorPage<Message> listMessages(AuthUser user, Long chatId, CursorLimit cursor) {
        if (!participantRepository.existsByChatIdAndMemberId(chatId, user.id()))
            throw new CodeException(ChatExceptionCode.NOT_PARTICIPANT);

        Window<MessageEntity> messages = messageRepository.findAllByChatId(
                chatId,
                cursor.toScrollPosition(),
                cursor.toLimit(),
                cursor.toSort()
        );

        return CursorPage.from(messages.map(Message::of), Message::id);
    }
}
