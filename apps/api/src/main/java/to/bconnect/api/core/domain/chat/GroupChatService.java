package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.chat.*;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupChatService {

    private final GroupChatRepository groupChatRepository;
    private final ParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final MessageService messageService;

    @Transactional(readOnly = true)
    public List<Chat> list(Long memberId) {
        val chatIds = participantRepository.findByMemberId(memberId)
                .stream().map(ParticipantEntity::getChatId).toList();

        if (chatIds.isEmpty()) return List.of();

        val chats = groupChatRepository.findAllById(chatIds);

        val participantMap = participantRepository.findByChatIdIn(chatIds)
                .stream()
                .collect(Collectors.groupingBy(
                        ParticipantEntity::getChatId,
                        Collectors.mapping(ParticipantEntity::getMemberId, Collectors.toList())
                ));

        val lastMessageMap = messageRepository.findLatestMessagesByChatIdInAndChatType(chatIds, ChatType.GROUP)
                .stream()
                .collect(Collectors.toMap(MessageEntity::getChatId, Message::of));

        val unreadCountMap = messageRepository.findGroupUnreadCountByChatIdsAndMemberId(chatIds, memberId);

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
        val participantIds = command.participantIds().stream().distinct().toList();

        if (!participantIds.contains(user.id()))
            throw new CodeException(ChatExceptionCode.SELF_NOT_INCLUDED);

        val created = groupChatRepository.save(new GroupChatEntity(command.title()));

        participantRepository.saveAll(participantIds.stream()
                .map(it -> new ParticipantEntity(created.getId(), it))
                .toList());

        messageService.send(
                created.getId(),
                ChatType.GROUP,
                Member.SYSTEM_ID,
                new SendMessage(MessageType.SYSTEM, MessageTemplate.CHAT_CREATED, List.of())
        );

        return created.getId();
    }

    @Transactional(readOnly = true)
    public CursorPage<Message> listMessages(AuthUser user, Long chatId, CursorLimit cursor) {
        if (!participantRepository.existsByChatIdAndMemberId(chatId, user.id()))
            throw new CodeException(ChatExceptionCode.NOT_PARTICIPANT);

        return messageService.list(chatId, ChatType.GROUP, cursor);
    }
}
