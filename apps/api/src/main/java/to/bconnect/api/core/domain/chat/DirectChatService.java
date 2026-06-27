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
public class DirectChatService {

    private final DirectChatRepository directChatRepository;
    private final MessageRepository messageRepository;
    private final MessageService messageService;

    @Transactional
    public Long findOrCreate(AuthUser user, CreateDirectChat command) {
        return findOrCreate(user.id(), command.memberId());
    }

    @Transactional
    public Long findOrCreate(Long memberId, Long otherId) {
        return directChatRepository.findByMembers(memberId, otherId)
                .map(DirectChatEntity::getId)
                .orElseGet(() -> {
                    val chatId = directChatRepository.save(DirectChatEntity.of(memberId, otherId)).getId();
                    messageService.send(chatId, ChatType.DIRECT, Member.SYSTEM_ID,
                            new SendMessage(MessageType.SYSTEM, MessageTemplate.CHAT_CREATED, List.of()));
                    return chatId;
                });
    }

    @Transactional(readOnly = true)
    public List<DirectChat> list(Long memberId) {
        val chats = directChatRepository.findAllByMember(memberId);

        if (chats.isEmpty()) return List.of();

        val chatIds = chats.stream().map(DirectChatEntity::getId).toList();

        val lastMessageMap = messageRepository.findLatestMessagesByChatIdInAndChatType(chatIds, ChatType.DIRECT)
                .stream()
                .collect(Collectors.toMap(MessageEntity::getChatId, Message::of));

        val unreadCountMap = messageRepository
                .findDirectUnreadCountByChatIdsAndMemberId(chatIds, memberId)
                .stream()
                .collect(Collectors.toMap(
                        it -> (Long) it[0],
                        it -> (Long) it[1]
                ));

        return chats.stream()
                .map(it -> DirectChat.of(
                        it,
                        it.counterpartIdOf(memberId),
                        lastMessageMap.get(it.getId()),
                        unreadCountMap.getOrDefault(it.getId(), 0L)
                )).toList();
    }

    @Transactional(readOnly = true)
    public CursorPage<Message> listMessages(AuthUser user, Long chatId, CursorLimit cursor) {
        if (!directChatRepository.existsByIdAndMember(chatId, user.id()))
            throw new CodeException(ChatExceptionCode.NOT_PARTICIPANT);

        return messageService.list(chatId, ChatType.DIRECT, cursor);
    }
}
