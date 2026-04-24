$ErrorActionPreference = 'Stop'

$repo = 'abubakerasif202/zqremovels'
$paths = @(
  'site-src/content/about/index.html',
  'site-src/content/adelaide-moving-guides/index.html',
  'site-src/content/adelaide-to-melbourne-removals/index.html',
  'site-src/content/adelaide-to-sydney-removals/index.html',
  'site-src/content/furniture-removalists-adelaide/index.html',
  'site-src/content/house-removals-adelaide/index.html',
  'site-src/content/index.html',
  'site-src/content/interstate-removals-adelaide/index.html',
  'site-src/content/office-removals-adelaide/index.html',
  'site-src/content/packing-services-adelaide/index.html',
  'site-src/content/premium-moving-concepts/index.html',
  'site-src/content/removalists-adelaide-cbd/index.html',
  'site-src/content/removalists-adelaide/index.html',
  'site-src/content/removalists-andrews-farm/index.html',
  'site-src/content/removalists-elizabeth/index.html',
  'site-src/content/removalists-glenelg/index.html',
  'site-src/content/removalists-hallett-cove/index.html',
  'site-src/content/removalists-marion/index.html',
  'site-src/content/removalists-mawson-lakes/index.html',
  'site-src/content/removalists-north-adelaide/index.html',
  'site-src/content/removalists-norwood/index.html',
  'site-src/content/removalists-salisbury/index.html',
  'site-src/content/removalists-seaford/index.html',
  'site-src/content/removalists-southern-adelaide/index.html',
  'media/Gemini_Generated_Image_.webp',
  'media/about-team-branded.webp',
  'media/custom-operations-source.webp',
  'media/Gemini_Generated_Image_ (1).webp',
  'media/Gemini_Generated_Image_ (2).webp',
  'media/Gemini_Generated_Image_ (3).webp',
  'media/Gemini_Generated_Image_ (4).webp',
  'media/Gemini_Generated_Image_ (5).webp',
  'media/Gemini_Generated_Image_ (6).webp',
  'media/Gemini_Generated_Image_ (7).webp',
  'media/Gemini_Generated_Image_ (8).webp',
  'media/Gemini_Generated_Image_ (10).webp',
  'media/Gemini_Generated_Image_ (11).webp'
)

Write-Output "publishing $($paths.Count) paths"

$tmp = Join-Path (Get-Location) '.codex-gh-api.json'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-JsonFile($value) {
  $json = $value | ConvertTo-Json -Depth 20
  [IO.File]::WriteAllText($tmp, $json, $utf8NoBom)
}

function Invoke-GhJson($arguments) {
  $output = & gh @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "gh failed: gh $($arguments -join ' ')"
  }
  return $output | ConvertFrom-Json
}

try {
  $ref = Invoke-GhJson @('api', "repos/$repo/git/ref/heads/main")
  $baseSha = $ref.object.sha
  $baseCommit = Invoke-GhJson @('api', "repos/$repo/git/commits/$baseSha")
  $entries = @()

  for ($i = 0; $i -lt $paths.Count; $i++) {
    $rel = $paths[$i]
    if (-not (Test-Path -LiteralPath $rel)) {
      throw "Missing intended file: $rel"
    }

    if ($rel -like '*.webp') {
      $resolved = (Resolve-Path -LiteralPath $rel).Path
      $content = [Convert]::ToBase64String([IO.File]::ReadAllBytes($resolved))
      $encoding = 'base64'
    } else {
      $content = Get-Content -LiteralPath $rel -Raw -Encoding UTF8
      $encoding = 'utf-8'
    }

    Write-JsonFile @{ content = $content; encoding = $encoding }

    $blob = Invoke-GhJson @('api', "repos/$repo/git/blobs", '--method', 'POST', '--input', $tmp)
    $entries += @{ path = $rel; mode = '100644'; type = 'blob'; sha = $blob.sha }

    if ((($i + 1) % 10) -eq 0) {
      Write-Output "uploaded $($i + 1) blobs"
    }
  }

  Write-JsonFile @{ base_tree = $baseCommit.tree.sha; tree = $entries }
  $tree = Invoke-GhJson @('api', "repos/$repo/git/trees", '--method', 'POST', '--input', $tmp)

  Write-JsonFile @{ message = 'V5: replace images with optimized webp versions'; tree = $tree.sha; parents = @($baseSha) }
  $commit = Invoke-GhJson @('api', "repos/$repo/git/commits", '--method', 'POST', '--input', $tmp)

  Write-JsonFile @{ sha = $commit.sha; force = $false }
  Invoke-GhJson @('api', "repos/$repo/git/refs/heads/main", '--method', 'PATCH', '--input', $tmp) | Out-Null

  Write-Output "pushed $($commit.sha)"
} finally {
  Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
}
