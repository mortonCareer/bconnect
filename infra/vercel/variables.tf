variable "vercel_api_token" {
  description = "Vercel API 토큰"
  type        = string
  sensitive   = true
}

variable "api_url" {
  description = "Backend API URL (from Railway)"
  type        = string
}

variable "project_name" {
  description = "Project name (used for Vercel project name prefix)"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository (owner/repo)"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch to deploy"
  type        = string
  default     = "main"
}
