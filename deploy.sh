#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SkillTrack — Deploy to GoDaddy via FTP
# Usage: bash deploy.sh
#
# Before first use:
#   1. Copy deploy.env.example to deploy.env
#   2. Fill in your GoDaddy FTP credentials
#   3. Run: bash deploy.sh
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/deploy.env"

# ── Load credentials ──────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: deploy.env not found."
  echo "Copy deploy.env.example to deploy.env and fill in your FTP credentials."
  exit 1
fi
source "$ENV_FILE"

if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ] || [ -z "$FTP_REMOTE_DIR" ]; then
  echo "ERROR: Missing FTP credentials in deploy.env"
  exit 1
fi

# ── Files to deploy ──────────────────────────────────────────
# Exclude: deploy files, git files, local-only files, docs
EXCLUDE=(
  "deploy.sh"
  "deploy.env"
  "deploy.env.example"
  "debug.php"
  "ai-test.php"
  ".gitignore"
  ".git"
  "DOCS.md"
)

echo "═══════════════════════════════════════════"
echo " SkillTrack — Deploying to GoDaddy"
echo "═══════════════════════════════════════════"
echo " Host: $FTP_HOST"
echo " Path: $FTP_REMOTE_DIR"
echo ""

# ── Check for lftp (preferred) or curl ────────────────────────
if command -v lftp &> /dev/null; then
  echo "Using lftp for deployment..."

  # Build exclude args
  EXCLUDE_ARGS=""
  for ex in "${EXCLUDE[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude $ex"
  done

  lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" <<EOF
set ssl:verify-certificate no
set ftp:ssl-allow yes
mirror --reverse --delete --verbose --parallel=4 $EXCLUDE_ARGS "$SCRIPT_DIR/" "$FTP_REMOTE_DIR/"
bye
EOF

  echo ""
  echo "✓ Deploy complete!"

elif command -v curl &> /dev/null; then
  echo "Using curl for deployment (slower, file-by-file)..."

  # Find all files to upload
  cd "$SCRIPT_DIR"
  find . -type f \
    ! -name "deploy.sh" \
    ! -name "deploy.env" \
    ! -name "deploy.env.example" \
    ! -name "debug.php" \
    ! -name "ai-test.php" \
    ! -name ".gitignore" \
    ! -name "DOCS.md" \
    ! -path "./.git/*" \
    | while read -r file; do
      # Get relative path without leading ./
      rel="${file#./}"
      remote_path="$FTP_REMOTE_DIR/$rel"
      remote_dir=$(dirname "$remote_path")

      echo "  Uploading: $rel"
      # Create directory if needed
      curl -s --ftp-create-dirs \
        -u "$FTP_USER:$FTP_PASS" \
        -T "$file" \
        "ftp://$FTP_HOST/$remote_path" \
        || echo "    WARNING: Failed to upload $rel"
    done

  echo ""
  echo "✓ Deploy complete!"

else
  echo "ERROR: Neither 'lftp' nor 'curl' found."
  echo ""
  echo "Install lftp:"
  echo "  Windows (Git Bash): Download from https://nwgat.ninja/lftp-for-windows/"
  echo "  Mac: brew install lftp"
  echo "  Linux: sudo apt install lftp"
  echo ""
  echo "Or use curl (usually pre-installed)."
  exit 1
fi

echo ""
echo "Site: https://akilanramesh.com/skilltrack/"
