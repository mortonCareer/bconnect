package to.bconnect.api.socket.message;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.core.domain.attachment.AttachmentQueryService;
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
import java.util.List;
import java.util.Set;
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

    @Transactional
    public Message broadcast(AuthUser user, Long chatId, SendMessage command) {
        List<Long> attachmentIds = command.attachmentIds();

        if (!attachmentIds.isEmpty())
            attachmentQueryService.list(user, attachmentIds);

        MessageEntity created = messageRepository.save(new MessageEntity(
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
        String dest = WebSocketAuthorizationConfig.CHAT_TOPIC_PREFIX + chatId;

        Set<String> usernames = simpUserRegistry
                .findSubscriptions(it -> dest.equals(it.getDestination()))
                .stream()
                .map(it -> it.getSession().getUser().getName())
                .collect(Collectors.toCollection(HashSet::new));

        List<Long> memberIds = memberRepository.findIdsByUsernameIn(usernames);
        participantRepository.updateLastIdxIn(chatId, memberIds, created.getId());

        return Message.of(created, attachmentIds);
    }
}
