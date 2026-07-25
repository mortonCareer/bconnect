package to.bconnect.api.storage.notification;

import jakarta.persistence.Embeddable;

@Embeddable
public record NotificationArgs(String senderName, String companyName) {

    public NotificationArgs {
        senderName = senderName == null ? "" : senderName;
        companyName = companyName == null ? "" : companyName;
    }

    public static NotificationArgs empty() {
        return new NotificationArgs(null, null);
    }

    public static NotificationArgs senderName(String senderName) {
        return new NotificationArgs(senderName, null);
    }

    public static NotificationArgs companyName(String companyName) {
        return new NotificationArgs(null, companyName);
    }

    public boolean isEmpty() {
        return senderName.isEmpty() && companyName.isEmpty();
    }
}
