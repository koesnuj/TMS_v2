<#
  로컬 개발용 PostgreSQL 컨테이너 시작 스크립트 (Docker 또는 Podman)

  - Docker가 있으면 docker compose / docker-compose를 사용
  - Docker가 없고 Podman이 있으면 podman run으로 Postgres 컨테이너를 생성/시작

  사용:
    .\scripts\start_postgres.ps1
    .\scripts\start_postgres.ps1 -Engine podman
    .\scripts\start_postgres.ps1 -Engine docker

  참고:
    - DATABASE_URL 기본값(backend/.env): postgresql://postgres:postgres@localhost:5432/tms_dev
    - 컨테이너 이름: tms_postgres
    - 볼륨 이름(Podman): tms_postgres_data
#>

[CmdletBinding()]
param(
  [ValidateSet("auto","docker","podman")]
  [string]$Engine = "auto"
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) {
  Write-Host ""
  Write-Host "==> $msg" -ForegroundColor Cyan
}

function Has-Command([string]$name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Ensure-Podman-Machine() {
  # Windows/WSL 환경에서 podman machine이 꺼져있으면 시작
  try {
    $info = podman info --format "{{.Host.Os}}" 2>$null
    if ($LASTEXITCODE -eq 0 -and $info) { return }
  } catch {}

  Write-Step "podman machine 시작 시도"
  podman machine start | Out-Host
}

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ($Engine -eq "auto") {
  if (Has-Command "docker") { $Engine = "docker" }
  elseif (Has-Command "podman") { $Engine = "podman" }
  else { throw "docker/podman을 찾지 못했습니다. Docker Desktop 또는 Podman Desktop/CLI를 설치해주세요." }
}

if ($Engine -eq "docker") {
  if (-not (Has-Command "docker")) { throw "docker 명령을 찾지 못했습니다." }
  Write-Step "Docker로 PostgreSQL 기동"
  $hasComposeV2 = $false
  try { docker compose version *> $null; $hasComposeV2 = $true } catch { $hasComposeV2 = $false }

  if ($hasComposeV2) { docker compose up -d postgres }
  else {
    if (-not (Has-Command "docker-compose")) { throw "docker-compose를 찾지 못했습니다." }
    docker-compose up -d postgres
  }
  exit 0
}

# Podman 경로
if (-not (Has-Command "podman")) { throw "podman 명령을 찾지 못했습니다." }
Ensure-Podman-Machine

Write-Step "Podman으로 PostgreSQL 기동"

$containerName = "tms_postgres"
$volumeName = "tms_postgres_data"
$image = "docker.io/library/postgres:15-alpine"

# 볼륨 보장
podman volume exists $volumeName *> $null
if ($LASTEXITCODE -ne 0) {
  podman volume create $volumeName | Out-Host
}

# 컨테이너가 이미 있으면 시작만
podman container exists $containerName *> $null
if ($LASTEXITCODE -eq 0) {
  podman start $containerName | Out-Host
  Write-Host "이미 존재하는 컨테이너를 시작했습니다: $containerName" -ForegroundColor Green
  exit 0
}

# 신규 생성
podman run -d `
  --name $containerName `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=tms_dev `
  -p 5432:5432 `
  -v "${volumeName}:/var/lib/postgresql/data" `
  $image | Out-Host

Write-Host "PostgreSQL 컨테이너 생성/시작 완료: $containerName" -ForegroundColor Green



