package to.bconnect.api.socket.message;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.attachment.AttachmentValidator;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.domain.chat.SendMessage;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.socket.WebSocketAuthorizationConfig;
import to.bconnect.api.storage.chat.ChatType;
import to.bconnect.api.storage.chat.DirectChatRepository;
import to.bconnect.api.storage.chat.MessageAttachmentMappingEntity;
import to.bconnect.api.storage.chat.MessageAttachmentMappingRepository;
import to.bconnect.api.storage.chat.MessageEntity;
import to.bconnect.api.storage.chat.MessageRepository;
import to.bconnect.api.storage.chat.ParticipantRepository;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.MemberRepository;

import java.util.HashSet;
import java.util.stream.Collectors;

/**
 * @see org.springframework.messaging.simp.user.SimpUserRegistry
 */
@Service
@RequiredArgsConstructor
public class MessageSocketService {

    private final MessageRepository messageRepository;
    private final MessageAttachmentMappingRepository messageAttachmentMappingRepository;
    private final ParticipantRepository participantRepository;
    private final DirectChatRepository directChatRepository;
    private final MemberRepository memberRepository;
    private final AttachmentValidator attachmentValidator;
    private final SimpUserRegistry simpUserRegistry;

    @Transactional
    public Message broadcast(AuthUser user, Long chatId, ChatType chatType, SendMessage command) {
        val attachmentIds = command.attachmentIds();

        if (!attachmentIds.isEmpty())
            attachmentValidator.validate(user, attachmentIds);

        val created = messageRepository.save(new MessageEntity(
                chatId,
                chatType,
                user.id(),
                command.type(),
                command.content()
        ));

        if (!attachmentIds.isEmpty())
            messageAttachmentMappingRepository.saveAll(attachmentIds.stream()
                    .map(it -> new MessageAttachmentMappingEntity(created.getId(), it))
                    .toList());

        markAsRead(chatId, chatType, created.getId());

        return Message.of(created, attachmentIds);
    }

    private void markAsRead(Long chatId, ChatType chatType, Long messageId) {
        val prefix = chatType == ChatType.DIRECT
                ? WebSocketAuthorizationConfig.DIRECT_CHAT_TOPIC_PREFIX
                : WebSocketAuthorizationConfig.GROUP_CHAT_TOPIC_PREFIX;
        val dest = prefix + chatId;

        val usernames = simpUserRegistry
                .findSubscriptions(it -> dest.equals(it.getDestination()))
                .stream()
                .map(it -> it.getSession().getUser().getName())
                .collect(Collectors.toCollection(HashSet::new));

        val memberIds = memberRepository.findByUsernameIn(usernames).stream()
                .map(MemberEntity::getId)
                .toList();

        if (chatType == ChatType.DIRECT) {
            val chat = directChatRepository.findById(chatId)
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
            memberIds.forEach(it -> chat.markRead(it, messageId));
        } else {
            participantRepository.findByChatIdAndMemberIdIn(chatId, memberIds)
                    .forEach(it -> it.markRead(messageId));
        }
    }
}
