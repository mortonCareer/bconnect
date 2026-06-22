package to.bconnect.api.support.s3;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.Delete;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.ObjectIdentifier;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class S3FileStorage {

    private static final int MAX_DELETE_BATCH = 1000;

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final S3Properties properties;

    public String presignPut(String key, String contentType, Duration ttl) {
        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(properties.bucket())
                .key(key)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(ttl)
                .putObjectRequest(objectRequest)
                .build();

        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(presignRequest);
        return presigned.url().toExternalForm();
    }

    public Optional<StoredObject> head(String key) {
        HeadObjectRequest request = HeadObjectRequest.builder()
                .bucket(properties.bucket())
                .key(key)
                .build();

        try {
            HeadObjectResponse response = s3Client.headObject(request);
            return Optional.of(new StoredObject(response.contentType(), response.contentLength()));
        } catch (NoSuchKeyException e) {
            return Optional.empty();
        }
    }

    public void delete(String key) {
        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(properties.bucket())
                .key(key)
                .build();

        s3Client.deleteObject(request);
    }

    public void deleteAll(List<String> keys) {
        if (keys.isEmpty()) return;

        for (int from = 0; from < keys.size(); from += MAX_DELETE_BATCH) {
            List<ObjectIdentifier> identifiers = keys.subList(from, Math.min(from + MAX_DELETE_BATCH, keys.size())).stream()
                    .map(it -> ObjectIdentifier.builder().key(it).build())
                    .toList();

            DeleteObjectsRequest request = DeleteObjectsRequest.builder()
                    .bucket(properties.bucket())
                    .delete(Delete.builder().objects(identifiers).build())
                    .build();

            s3Client.deleteObjects(request);
        }
    }
}
