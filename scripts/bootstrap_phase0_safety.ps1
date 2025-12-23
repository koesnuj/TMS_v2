<# 
  Phase0 Safety 브랜치 개발환경 부트스트랩 스크립트 (Windows PowerShell)

  하는 일:
  - 루트/백엔드/프론트 npm ci
  - backend/.env 생성 및 DATABASE_URL 로컬 docker-compose(Postgres) 기본값으로 세팅
  - docker compose(up -d postgres)로 DB 기동 (docker 필요)
  - Prisma migrate deploy + seed
  - (옵션) 백/프 dev 서버 실행 안내

  사용:
    PowerShell에서 프로젝트 루트(TMS_v2)에서 실행:
      .\scripts\bootstrap_phase0_safety.ps1

    DB만 준비하고 싶으면:
      .\scripts\bootstrap_phase0_safety.ps1 -SkipFrontend -SkipRoot
#>

[CmdletBinding()]
param(
  [switch]$SkipRoot,
  [switch]$SkipBackend,
  [switch]$SkipFrontend,
  [switch]$SkipMigrate,
  [switch]$SkipSeed,
  [ValidateSet("auto","docker","podman")]
  [string]$ContainerEngine = "auto"
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) {
  Write-Host ""
  Write-Host "==> $msg" -ForegroundColor Cyan
}

function Assert-Command([string]$name, [string]$installHint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "❌ '$name' 명령을 찾지 못했습니다." -ForegroundColor Red
    if ($installHint) {
      Write-Host "   $installHint" -ForegroundColor Yellow
    }
    throw "Missing dependency: $name"
  }
}

Write-Step "필수 도구 확인 (node/npm)"
Assert-Command "node" "Node.js를 설치해주세요. (권장: LTS)"
Assert-Command "npm"  "Node.js 설치 시 npm이 함께 설치됩니다."

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not $SkipRoot) {
  Write-Step "루트 의존성 설치 (Playwright 등): npm ci"
  npm ci
}

if (-not $SkipBackend) {
  Write-Step "백엔드 의존성 설치: backend\\ npm ci"
  Push-Location "backend"
  npm ci

  Write-Step "backend/.env 준비"
  if (-not (Test-Path ".env")) {
    Copy-Item "env.example" ".env"
  }

  # docker-compose.yml 기본값에 맞춤
  (Get-Content ".env") |
    ForEach-Object { $_ -replace '^DATABASE_URL=.*$','DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tms_dev"' } |
    Set-Content ".env"

  Pop-Location
}

if (-not $SkipFrontend) {
  Write-Step "프론트엔드 의존성 설치: frontend\\ npm ci"
  Push-Location "frontend"
  npm ci
  Pop-Location
}

if (-not $SkipMigrate -or -not $SkipSeed) {
  Write-Step "PostgreSQL 컨테이너 기동 (Docker 또는 Podman)"
  # start_postgres.ps1가 docker/podman을 자동 감지하며, -Engine으로 강제 가능
  & "$root\scripts\start_postgres.ps1" -Engine $ContainerEngine

  Write-Step "DB 마이그레이션/시드"
  Push-Location "backend"

  if (-not $SkipMigrate) {
    npm run prisma:migrate:deploy
  }
  if (-not $SkipSeed) {
    npm run prisma:seed
  }

  Pop-Location
}

Write-Step "완료"
Write-Host "백엔드 실행:  cd backend  ; npm run dev" -ForegroundColor Green
Write-Host "프론트 실행:  cd frontend ; npm run dev" -ForegroundColor Green
Write-Host "기본 계정: admin@tms.com / admin123!" -ForegroundColor Green


