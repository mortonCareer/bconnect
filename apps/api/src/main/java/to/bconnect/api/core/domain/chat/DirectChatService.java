package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.chat.*;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.MemberRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DirectChatService {

    private final DirectChatRepository directChatRepository;
    private final MessageRepository messageRepository;
    private final MessageService messageService;
    private final MemberRepository memberRepository;

    @Transactional(readOnly = true)
    public List<DirectChat> list(Long memberId) {
        val chats = directChatRepository.findAllByMember(memberId);
        if (chats.isEmpty()) return List.of();

        val chatIds = chats.stream().map(DirectChatEntity::getId).toList();

        val lastMessageMap = messageRepository.findLatestMessagesByChatIdInAndChatType(chatIds, ChatType.DIRECT)
                .stream()
                .collect(Collectors.toMap(MessageEntity::getChatId, Message::of));

        val unreadCountMap = messageRepository.findDirectUnreadCountByChatIdsAndMemberId(chatIds, memberId);

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
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return messageService.list(chatId, ChatType.DIRECT, cursor);
    }

    @Transactional
    public Long findOrCreate(Long memberId, Long otherId) {
        if (!memberRepository.existsById(otherId))
            throw new CodeException(CommonExceptionCode.NOT_FOUND);

        val optional = directChatRepository.findByMembers(memberId, otherId);
        if (optional.isPresent())
            return optional.get().getId();

        val created = directChatRepository.save(DirectChatEntity.of(memberId, otherId));
        messageService.create(
                created.getId(),
                ChatType.DIRECT,
                MemberEntity.SYSTEM_ID,
                new SendMessage(MessageType.SYSTEM, MessageTemplate.CHAT_CREATED, List.of())
        );
        return created.getId();
    }
}
