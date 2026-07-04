package to.bconnect.api.attachment.infrastructure.s3;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.Delete;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.ObjectIdentifier;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

/**
 * References <br/>
 * - <a href="https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/examples-s3-presign.html">Developer Guide for version 2.x</a> <br/>
 * - <a href="https://docs.aws.amazon.com/AmazonS3/latest/API/API_Operations_Amazon_Simple_Storage_Service.html">API Reference</a>
 */
@Component
@RequiredArgsConstructor
public class S3FileStorage {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final S3Properties properties;

    public String presignPut(String key, String contentType, Duration ttl) {
        val objectRequest = PutObjectRequest.builder()
                .bucket(properties.bucket())
                .key(key)
                .contentType(contentType)
                .build();

        val presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(ttl)
                .putObjectRequest(objectRequest)
                .build();

        val presigned = s3Presigner.presignPutObject(presignRequest);
        return presigned.url().toExternalForm();
    }

    public Optional<ObjectHead> head(String key) {
        val request = HeadObjectRequest.builder()
                .bucket(properties.bucket())
                .key(key)
                .build();

        try {
            val response = s3Client.headObject(request);
            return Optional.of(new ObjectHead(response.contentType(), response.contentLength()));
        } catch (NoSuchKeyException e) {
            return Optional.empty();
        }
    }

    // idempotent
    public void delete(String key) {
        val request = DeleteObjectRequest.builder()
                .bucket(properties.bucket())
                .key(key)
                .build();

        s3Client.deleteObject(request);
    }

    public void deleteAll(List<String> keys) {
        if (keys.isEmpty()) return;

        val identifiers = keys.stream()
                .map(it -> ObjectIdentifier.builder().key(it).build())
                .toList();

        val request = DeleteObjectsRequest.builder()
                .bucket(properties.bucket())
                .delete(Delete.builder().objects(identifiers).build())
                .build();

        s3Client.deleteObjects(request);
    }
}
