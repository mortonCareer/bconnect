package to.bconnect.api.socket.message;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.attachment.AttachmentLinker;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.domain.chat.SendMessage;
import to.bconnect.api.core.domain.notification.NotificationService;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.socket.WebSocketSecurityConfig;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.chat.*;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.MemberRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * @see org.springframework.messaging.simp.user.SimpUserRegistry
 */
@Service
@RequiredArgsConstructor
public class MessageSocketService {

    private final MessageRepository messageRepository;
    private final ParticipantRepository participantRepository;
    private final DirectChatRepository directChatRepository;
    private final MemberRepository memberRepository;
    private final AttachmentLinker attachmentLinker;
    private final SimpUserRegistry simpUserRegistry;
    private final NotificationService notificationService;

    @Transactional
    public Message broadcast(AuthUser user, Long chatId, ChatType chatType, SendMessage command) {
        val created = messageRepository.save(new MessageEntity(
                chatId,
                chatType,
                user.id(),
                command.type(),
                command.content()
        ));

        attachmentLinker.link(user.id(), ReferenceType.MESSAGE, created.getId(), command.attachmentIds());
        val activeMemberIds = findActiveMemberIds(chatId, chatType);
        markAsRead(chatId, chatType, created.getId(), activeMemberIds);
        val recipientIds = findRecipientIds(user.id(), chatId, chatType);
        notificationService.notifyChatMessage(
                user.id(), chatId, recipientIds, activeMemberIds, command.content());
        return Message.of(created);
    }

    private Set<Long> findActiveMemberIds(Long chatId, ChatType chatType) {
        val prefix = chatType == ChatType.DIRECT
                ? WebSocketSecurityConfig.DIRECT_CHAT_TOPIC_PREFIX
                : WebSocketSecurityConfig.GROUP_CHAT_TOPIC_PREFIX;
        val dest = prefix + chatId;

        val usernames = simpUserRegistry
                .findSubscriptions(it -> dest.equals(it.getDestination()))
                .stream()
                .map(it -> it.getSession().getUser().getName())
                .collect(Collectors.toCollection(HashSet::new));

        return memberRepository.findByUsernameIn(usernames).stream()
                .map(MemberEntity::getId)
                .collect(Collectors.toSet());
    }

    private void markAsRead(Long chatId, ChatType chatType, Long messageId, Set<Long> memberIds) {
        if (chatType == ChatType.DIRECT) {
            val chat = findDirectChat(chatId);
            memberIds.forEach(it -> chat.markRead(it, messageId));
        } else {
            participantRepository.findByChatIdAndMemberIdIn(chatId, memberIds)
                    .forEach(it -> it.markRead(messageId));
        }
    }

    private List<Long> findRecipientIds(Long senderId, Long chatId, ChatType chatType) {
        if (chatType == ChatType.DIRECT) {
            return List.of(findDirectChat(chatId).counterpartIdOf(senderId));
        }

        return participantRepository.findMemberIdsByChatId(chatId).stream()
                .filter(id -> !id.equals(senderId))
                .toList();
    }

    private DirectChatEntity findDirectChat(Long chatId) {
        return directChatRepository.findById(chatId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }
}
