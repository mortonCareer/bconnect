# Instagram Parser Lambda Function

# Lambda 실행 역할
resource "aws_iam_role" "instagram_parser_lambda" {
  name = "instagram-parser-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# CloudWatch Logs 권한
resource "aws_iam_role_policy_attachment" "instagram_parser_logs" {
  role       = aws_iam_role.instagram_parser_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Python 소스 파일을 ZIP으로 패키징
data "archive_file" "instagram_parser" {
  type        = "zip"
  source_file = "${path.module}/lambda/instagram-parser/handler.py"
  output_path = "${path.module}/lambda/instagram-parser/function.zip"
}

# Lambda 함수
resource "aws_lambda_function" "instagram_parser" {
  function_name = "instagram-parser"
  role          = aws_iam_role.instagram_parser_lambda.arn
  handler       = "handler.handler"
  runtime       = "python3.12"
  timeout       = 60
  memory_size   = 512

  filename         = data.archive_file.instagram_parser.output_path
  source_code_hash = data.archive_file.instagram_parser.output_base64sha256
}

# Output
output "instagram_parser_function_name" {
  description = "Instagram Parser Lambda Function Name"
  value       = aws_lambda_function.instagram_parser.function_name
}

output "instagram_parser_arn" {
  description = "Instagram Parser Lambda Function ARN"
  value       = aws_lambda_function.instagram_parser.arn
}

# ─────────────────────────────────────────────────────────────
# Image Resize Lambda (#724)
# S3 원본 업로드(*/images/o/*) → webp 변형본(m: 800px, s: 400px) 생성.
# 핸들러가 key.includes('/images/o/') 로 self-filter → 출력물(/images/m/,/images/s/)엔
# 마커 없어 재귀 트리거 없음. prod/dev 두 버킷 대칭(local.cdns), 함수는 1개 공유.
# sharp 네이티브 바이너리는 lambda/image-resize/build.sh 로 linux/arm64 prebuilt 를 받아
# 번들한다 — terraform apply 전 build.sh 실행 필수(archive_file 이 폴더째 zip).
# ─────────────────────────────────────────────────────────────

resource "aws_iam_role" "image_resize_lambda" {
  name = "image-resize-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "image_resize_logs" {
  role       = aws_iam_role.image_resize_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 원본 GetObject + 변형본 PutObject — prod/dev 두 버킷 모두.
resource "aws_iam_role_policy" "image_resize_s3" {
  name = "image-resize-s3"
  role = aws_iam_role.image_resize_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = [for c in local.cdns : "${c.bucket_arn}/*"]
      }
    ]
  })
}

# Node 소스 + build.sh 로 받은 node_modules(sharp) 를 폴더째 ZIP.
# function.zip(산출물 자신)과 build.sh(런타임 불필요)는 제외.
data "archive_file" "image_resize" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/image-resize"
  output_path = "${path.module}/lambda/image-resize/function.zip"
  excludes    = ["function.zip", "build.sh"]
}

resource "aws_lambda_function" "image_resize" {
  function_name = "image-resize"
  role          = aws_iam_role.image_resize_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  timeout       = 60
  memory_size   = 1024 # libvips(sharp) 메모리 여유 + Lambda CPU 는 메모리 비례 할당

  filename         = data.archive_file.image_resize.output_path
  source_code_hash = data.archive_file.image_resize.output_base64sha256
}

# S3 → Lambda 호출 권한(버킷당 1). prefix 필터로 */images/o/* 를 못 잡으므로
# 전체 ObjectCreated 에 걸고 핸들러가 self-filter.
resource "aws_lambda_permission" "image_resize_s3" {
  for_each      = local.cdns
  statement_id  = "AllowS3Invoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_resize.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = each.value.bucket_arn
}

resource "aws_s3_bucket_notification" "image_resize" {
  for_each = local.cdns
  bucket   = each.value.bucket_id

  lambda_function {
    lambda_function_arn = aws_lambda_function.image_resize.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.image_resize_s3]
}

output "image_resize_function_name" {
  description = "Image Resize Lambda Function Name"
  value       = aws_lambda_function.image_resize.function_name
}

output "image_resize_arn" {
  description = "Image Resize Lambda Function ARN"
  value       = aws_lambda_function.image_resize.arn
}
