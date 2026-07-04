package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.AttachmentLinker;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.chat.*;
import to.bconnect.api.storage.member.MemberEntity;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final AttachmentLinker attachmentLinker;

    @Transactional
    public void create(Long chatId, ChatType type, Long senderId, SendMessage command) {
        val created = messageRepository.save(new MessageEntity(
                chatId, type, senderId, command.type(), command.content()));

        attachmentLinker.link(senderId, ReferenceType.MESSAGE, created.getId(), command.attachmentIds());
    }

    @Transactional
    public void createSystemMessage(Long chatId, ChatType type, String content) {
        messageRepository.save(new MessageEntity(
                chatId,
                type,
                MemberEntity.SYSTEM_ID,
                MessageType.SYSTEM,
                content
        ));
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
}
