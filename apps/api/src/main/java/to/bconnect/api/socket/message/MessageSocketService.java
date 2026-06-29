package to.bconnect.api.socket.message;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.core.domain.attachment.AttachmentQueryService;
import to.bconnect.api.core.domain.notification.NotificationService;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.domain.chat.SendMessage;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.socket.WebSocketAuthorizationConfig;
import to.bconnect.api.storage.chat.MessageAttachmentMappingEntity;
import to.bconnect.api.storage.chat.MessageAttachmentMappingRepository;
import to.bconnect.api.storage.chat.MessageEntity;
import to.bconnect.api.storage.chat.MessageRepository;
import to.bconnect.api.storage.chat.ParticipantRepository;
import to.bconnect.api.storage.member.MemberRepository;

import java.util.HashSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageSocketService {

    private final MessageRepository messageRepository;
    private final MessageAttachmentMappingRepository messageAttachmentMappingRepository;
    private final ParticipantRepository participantRepository;
    private final MemberRepository memberRepository;
    private final AttachmentQueryService attachmentQueryService;
    private final SimpUserRegistry simpUserRegistry;
    private final NotificationService notificationService;

    @Transactional
    public Message broadcast(AuthUser user, Long chatId, SendMessage command) {
        val attachmentIds = command.attachmentIds();

        if (!attachmentIds.isEmpty())
            attachmentQueryService.list(user, attachmentIds);

        val created = messageRepository.save(new MessageEntity(
                chatId,
                user.id(),
                command.type(),
                command.content()
        ));

        if (!attachmentIds.isEmpty())
            messageAttachmentMappingRepository.saveAll(attachmentIds.stream()
                    .map(it -> new MessageAttachmentMappingEntity(created.getId(), it))
                    .toList());

        // mark as read
        val dest = WebSocketAuthorizationConfig.CHAT_TOPIC_PREFIX + chatId;

        val usernames = simpUserRegistry
                .findSubscriptions(it -> dest.equals(it.getDestination()))
                .stream()
                .map(it -> it.getSession().getUser().getName())
                .collect(Collectors.toCollection(HashSet::new));

        val activeMemberIds = memberRepository.findIdsByUsernameIn(usernames);
        participantRepository.updateLastIdxIn(chatId, activeMemberIds, created.getId());

        val recipientIds = participantRepository.findMemberIdsByChatId(chatId).stream()
                .filter(id -> !id.equals(user.id()))
                .toList();
        notificationService.notifyChatMessage(
                user.id(), chatId, recipientIds, new HashSet<>(activeMemberIds), command.content());

        return Message.of(created, attachmentIds);
    }
}
