package to.bconnect.api.core.domain.task;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.attachment.AttachmentLinker;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.post.PostEntity;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskRepository;

import java.util.Collection;

@Component
@RequiredArgsConstructor
public class TaskManager {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final OfferRepository offerRepository;
    private final PostRepository postRepository;
    private final AttachmentLinker attachmentLinker;

    public void deleteByIds(Collection<Long> taskIds) {
        if (taskIds.isEmpty())
            return;

        offerRepository.deleteByTaskIdIn(taskIds);

        val posts = postRepository.findByTaskIdIn(taskIds);
        val postIds = posts.stream().map(PostEntity::getId).toList();
        if (!postIds.isEmpty())
            attachmentLinker.unlink(ReferenceType.POST, postIds);
        postRepository.deleteAll(posts);

        taskRepository.deleteAllById(taskIds);
    }

    public Long getCompanyOwnerId(Long taskId) {
        val task = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        val project = projectRepository.findById(task.getProjectId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        val company = companyRepository.findById(project.getCompanyId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        return company.getMemberId();
    }
}
