terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.92"
      # CloudFront viewer 인증서(ACM)는 us-east-1 강제 → 루트에서 aliased provider 주입.
      configuration_aliases = [aws.us_east_1]
    }
  }
}
