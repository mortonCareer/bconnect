package to.bconnect.api.notification.domain;

import to.bconnect.api.common.CodeException;
import to.bconnect.api.core.domain.notification.NotificationArgs;
import to.bconnect.api.core.domain.notification.NotificationExceptionCode;
import to.bconnect.api.storage.notification.NotificationReferenceType;

/**
 * 알림 타입 정의. 타입별 메시지 템플릿(format string)·이동 링크·reference_type 을 enum 안에서 개별화한다.
 * DB 에는 {@code type_code}(= {@link #name()})와 {@code reference_id} 만 저장하고,
 * reference_type·메시지·링크는 이 enum 이 소유한다.
 * <p>메시지는 {@code template.formatted(formatArgs(args))} 로 렌더한다 — placeholder 는 필요한 만큼 늘릴 수 있다.
 */
public enum NotificationType {

    CHAT_MESSAGE(NotificationReferenceType.CHAT_ROOM, "%s님이 메시지를 보냈습니다") {
        @Override
        protected Object[] formatArgs(NotificationArgs args) {
            return new Object[]{args.get(NotificationArgs.SENDER_NAME)};
        }
    },

    SIGNUP_WELCOME(NotificationReferenceType.NONE, "회원가입을 축하드립니다") {
        @Override
        protected Object[] formatArgs(NotificationArgs args) {
            return NO_ARGS;
        }
    },

    PROFILE_COMPLETION(NotificationReferenceType.PROFILE, "프로필을 완성하고 업체로부터 일감을 받아보세요") {
        @Override
        protected Object[] formatArgs(NotificationArgs args) {
            return NO_ARGS;
        }
    },

    COWORKER_REQUESTED(NotificationReferenceType.COWORKER_REQUEST, "%s 님으로부터 동료 요청을 제안받았습니다") {
        @Override
        protected Object[] formatArgs(NotificationArgs args) {
            return new Object[]{args.get(NotificationArgs.SENDER_NAME)};
        }
    },

    OFFER_RECEIVED(NotificationReferenceType.OFFER, "%s으로부터 섭외 요청을 제안받았습니다") {
        @Override
        protected Object[] formatArgs(NotificationArgs args) {
            return new Object[]{args.get(NotificationArgs.COMPANY_NAME)};
        }
    },

    CONTRACT_WRITTEN(NotificationReferenceType.CONTRACT, "%s 님으로부터 계약서를 작성받았습니다") {
        @Override
        protected Object[] formatArgs(NotificationArgs args) {
            return new Object[]{args.get(NotificationArgs.SENDER_NAME)};
        }
    };

    protected static final Object[] NO_ARGS = new Object[0];

    private final NotificationReferenceType referenceType;
    private final String template;

    NotificationType(NotificationReferenceType referenceType, String template) {
        this.referenceType = referenceType;
        this.template = template;
    }

    /** 템플릿에 채워 넣을 값. placeholder 순서대로 반환한다. (2개 이상도 배열 크기만 늘리면 됨) */
    protected abstract Object[] formatArgs(NotificationArgs args);

    public String render(NotificationArgs args) {
        return template.formatted(formatArgs(args));
    }

    public NotificationReferenceType referenceType() {
        return referenceType;
    }

    public String code() {
        return name();
    }

    /** push 로 내려줄 이동 링크. reference_type + reference_id 로 매번 만든다. NONE(이동 없음)은 null. */
    public String link(Long referenceId) {
        if (referenceType == NotificationReferenceType.NONE) return null;
        String segment = referenceType.name().toLowerCase();
        return referenceId == null ? "/n/" + segment : "/n/" + segment + "/" + referenceId;
    }

    public static NotificationType from(String code) {
        try {
            return NotificationType.valueOf(code);
        } catch (IllegalArgumentException e) {
            throw new CodeException(NotificationExceptionCode.UNKNOWN_TYPE);
        }
    }
}
