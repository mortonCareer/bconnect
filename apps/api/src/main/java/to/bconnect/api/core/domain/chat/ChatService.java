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
    private final MessageAttachmentMappingRepository messageAttachmentMappingRepository;

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
                        it -> (Long) it[0],
                        it -> (Long) it[1]
                ));

        return chats.stream()
                .map(it -> Chat.of(
                        it,
                        participantMap.getOrDefault(it.getId(), List.of()),
                        lastMessageMap.get(it.getId()),
                        unreadCountMap.getOrDefault(it.getId(), 0L)
                )).toList();
    }

    @Transactional
    public Long create(AuthUser user, CreateChat command) {
        List<Long> participantIds = command.participantIds().stream().distinct().toList();

        if (!participantIds.contains(user.id()))
            throw new CodeException(ChatExceptionCode.SELF_NOT_INCLUDED);

        ChatEntity created = chatRepository.save(new ChatEntity(command.title()));

        participantRepository.saveAll(participantIds.stream()
                .map(it -> new ParticipantEntity(created.getId(), it))
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

        List<Long> messageIds = messages.getContent().stream().map(MessageEntity::getId).toList();
        Map<Long, List<Long>> attachmentIdMap = messageAttachmentMappingRepository.findByMessageIdIn(messageIds)
                .stream()
                .collect(Collectors.groupingBy(
                        MessageAttachmentMappingEntity::getMessageId,
                        Collectors.mapping(MessageAttachmentMappingEntity::getAttachmentId, Collectors.toList())
                ));

        return CursorPage.from(
                messages.map(it -> Message.of(it, attachmentIdMap.getOrDefault(it.getId(), List.of()))),
                Message::id
        );
    }
}
