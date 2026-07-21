package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.domain.AttachmentLinker;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.chat.*;

import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ParticipantRepository participantRepository;
    private final DirectChatRepository directChatRepository;
    private final AttachmentLinker attachmentLinker;

    @Transactional
    public Message create(Long chatId, ChatType type, Long senderId, SendMessage command) {
        val created = messageRepository.save(new MessageEntity(
                chatId, type, senderId, command.type(), command.content()));

        attachmentLinker.link(senderId, ReferenceType.MESSAGE, created.getId(), command.attachmentIds());
        return Message.of(created);
    }

    @Transactional(readOnly = true)
    public CursorPage<Message> list(Long chatId, ChatType type, CursorLimit cursor) {
        val messages = messageRepository.findAllByChatIdAndChatType(
                chatId,
                type,
                cursor.toScrollPosition(),
                cursor.toLimit(),
                cursor.toSort()
        );

        return CursorPage.from(
                messages.map(Message::of),
                Message::id
        );
    }

    @Transactional
    public void markRead(Long chatId, ChatType type, Collection<Long> memberIds, Long messageId) {
        if (type == ChatType.DIRECT) {
            directChatRepository.findById(chatId)
                    .ifPresent(chat -> memberIds.forEach(it -> chat.markRead(it, messageId)));
        } else {
            participantRepository.findAllByChatIdAndMemberIdIn(chatId, memberIds)
                    .forEach(it -> it.markRead(messageId));
        }
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
                    .ifPresent(it -> it.markRead(messageId));
    }

    @Transactional(readOnly = true)
    public List<Long> listRecipientIds(Long chatId, ChatType type, Long senderId) {
        if (type == ChatType.DIRECT) {
            val chat = directChatRepository.findById(chatId)
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
            return List.of(chat.counterpartIdOf(senderId));
        }

        return participantRepository.findMemberIdsByChatId(chatId).stream()
                .filter(id -> !id.equals(senderId))
                .toList();
    }
}
