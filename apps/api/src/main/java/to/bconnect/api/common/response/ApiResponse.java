package to.bconnect.api.common.response;

import to.bconnect.api.common.ExceptionCode;

public record ApiResponse<T>(
        boolean success,
        ExceptionCode error,
        T data
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, null, data);
    }

    public static <T> ApiResponse<T> error(ExceptionCode error) {
        return new ApiResponse<>(false, error, null);
    }
}
