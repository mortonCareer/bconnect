package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.security.AuthUser;
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
    public Long create(AuthUser user, CreateDirectChat command) {
        val minId = Math.min(user.id(), command.memberId());
        val maxId = Math.max(user.id(), command.memberId());

        return directChatRepository.findByMinIdAndMaxId(minId, maxId)
                .map(DirectChatEntity::getId)
                .orElseGet(() -> directChatRepository.save(new DirectChatEntity(minId, maxId)).getId());
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
                        it.getMinId().equals(memberId) ? it.getMaxId() : it.getMinId(),
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
