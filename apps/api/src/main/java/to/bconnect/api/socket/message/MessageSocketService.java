package to.bconnect.api.socket.message;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.chat.MessageEntity;
import to.bconnect.api.storage.chat.MessageRepository;
import to.bconnect.api.storage.chat.ParticipantRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.chat.MessageType;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.socket.WebSocketAuthorizationConfig;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageSocketService {

    private final MessageRepository messageRepository;
    private final ParticipantRepository participantRepository;
    private final MemberRepository memberRepository;
    private final SimpUserRegistry simpUserRegistry;

    @Transactional
    public void broadcast(AuthUser user, Long chatId, SendMessageRequest request) {
        if (request.type() == MessageType.SYSTEM)
            throw new CodeException(CommonExceptionCode.NOT_VALID);

        MessageEntity entity = messageRepository.save(new MessageEntity(
                chatId,
                user.id(),
                request.type(),
                request.content()
        ));

        String dest = WebSocketAuthorizationConfig.CHAT_TOPIC_PREFIX + chatId;

        Set<String> usernames = simpUserRegistry
                .findSubscriptions(sub -> dest.equals(sub.getDestination()))
                .stream()
                .map(sub -> sub.getSession().getUser().getName())
                .collect(Collectors.toCollection(HashSet::new));

        List<Long> memberIds = memberRepository.findIdsByUsernameIn(usernames);
        participantRepository.updateLastIdxIn(chatId, memberIds, entity.getId());
    }
}
