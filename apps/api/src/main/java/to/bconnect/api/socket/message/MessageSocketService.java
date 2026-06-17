package to.bconnect.api.socket.message;

import lombok.RequiredArgsConstructor;
import lombok.val;
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

        val created = messageRepository.save(new MessageEntity(
                chatId,
                user.id(),
                request.type(),
                request.content()
        ));

        val dest = WebSocketAuthorizationConfig.CHAT_TOPIC_PREFIX + chatId;

        val usernames = simpUserRegistry
                .findSubscriptions(it -> dest.equals(it.getDestination()))
                .stream()
                .map(it -> it.getSession().getUser().getName())
                .collect(Collectors.toCollection(HashSet::new));

        val memberIds = memberRepository.findIdsByUsernameIn(usernames);
        participantRepository.updateLastIdxIn(chatId, memberIds, created.getId());
    }
}
