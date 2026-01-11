#!/bin/bash
cd "$CLAUDE_PROJECT_DIR"

pnpm lint         # ESLint
pnpm format       # Prettier
./gradlew build   # Build
./gradlew test    # Test
