resource "tls_private_key" "cf_signing" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "aws_cloudfront_public_key" "cf_signing" {
  name        = "bconnect-signed-cookie"
  encoded_key = tls_private_key.cf_signing.public_key_pem
}
