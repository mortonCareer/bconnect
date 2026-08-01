package to.bconnect.api.socket.message;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.domain.AttachmentFinder;
import to.bconnect.api.attachment.domain.AttachmentLinker;
import to.bconnect.api.core.domain.chat.Message;
import to.bconnect.api.core.domain.chat.SendMessage;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.chat.ChatType;
import to.bconnect.api.storage.chat.DirectChatRepository;
import to.bconnect.api.storage.chat.MessageEntity;
import to.bconnect.api.storage.chat.MessageRepository;
import to.bconnect.api.storage.chat.ParticipantRepository;

import java.util.Collection;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ParticipantRepository participantRepository;
    private final DirectChatRepository directChatRepository;
    private final AttachmentFinder attachmentFinder;
    private final AttachmentLinker attachmentLinker;

    @Transactional
    public Message create(Long chatId, ChatType type, Long senderId, SendMessage command) {
        val created = messageRepository.save(new MessageEntity(
                chatId, type, senderId, command.type(), command.content()));

        attachmentFinder.validateOwnership(senderId, command.attachmentIds());
        attachmentLinker.link(AttachmentReferenceType.MESSAGE, created.getId(), command.attachmentIds());
        return Message.of(created);
    }

    @Transactional
    public void markReadLatest(Long chatId, ChatType type, Long memberId) {
        val optional = messageRepository.findFirstByChatIdAndChatTypeOrderByIdDesc(chatId, type);
        if (optional.isEmpty())
            return;

        val messageId = optional.get().getId();
        if (type == ChatType.DIRECT)
            directChatRepository.findById(chatId).ifPresent(it -> it.markRead(memberId, messageId));
        else
            participantRepository.findByChatIdAndMemberId(chatId, memberId)
                    .ifPresent(it -> it.read(messageId));
    }

    @Transactional
    public void markRead(Long chatId, ChatType type, Collection<Long> memberIds, Long messageId) {
        if (type == ChatType.DIRECT) {
            directChatRepository.findById(chatId)
                    .ifPresent(chat -> memberIds.forEach(it -> chat.markRead(it, messageId)));
        } else {
            participantRepository.findAllByChatIdAndMemberIdIn(chatId, memberIds)
                    .forEach(it -> it.read(messageId));
        }
    }
}
