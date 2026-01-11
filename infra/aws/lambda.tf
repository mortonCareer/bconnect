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
