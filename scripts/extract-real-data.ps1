# ============================================================
# extract-real-data.ps1
#
# Imports SGRWDH lemmata from human-collected files (.accdb +
# .xlsx) into a single src/data/dataset.json. Designed to be
# rerun whenever students hand in new data.
#
# Usage (from any cwd):
#   powershell -ExecutionPolicy Bypass -File scripts/extract-real-data.ps1
#
#   # custom input folder / output file:
#   powershell -ExecutionPolicy Bypass -File scripts/extract-real-data.ps1 `
#       -InputDir "C:\path\to\some_other_folder" `
#       -OutputFile "src\data\other.json"
#
# Conventions assumed for incoming files (case-insensitive,
# substring match — student naming variants are tolerated):
#
#   accdb tables / xlsx sheets:
#     - "authors"          → authors
#     - "individual works" / "works" (NOT containing "part") → works
#     - "part" + "work"    → parts of works
#     - "periods"          → periods
#     - "sources"          → sources
#
#   columns (header row): the script uses case-insensitive,
#   space/underscore-insensitive matching, so headers like
#   "Author_Name" or "Author Name" or "author name" all map to
#   the same canonical field.
#
# Requires Microsoft.ACE.OLEDB.16.0 (Access Database Engine
# 2016, x64) and Excel COM (any local Office install).
# ============================================================

[CmdletBinding()]
param(
    [string]$InputDir,
    [string]$OutputFile
)

$ErrorActionPreference = 'Stop'

$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

if (-not $InputDir) {
    $InputDir = Resolve-Path (Join-Path $projectRoot '..\human_lemma') | Select-Object -ExpandProperty Path
}
if (-not $OutputFile) {
    $OutputFile = Join-Path $projectRoot 'src\data\dataset.json'
}

if (-not (Test-Path $InputDir)) { throw "Input directory not found: $InputDir" }

$outDir = Split-Path -Parent $OutputFile
if ($outDir -and -not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }

Write-Host "Input dir : $InputDir"
Write-Host "Output    : $OutputFile"

# ────────────────────────────────────────────────────────────
# Sheet / table → canonical kind mapping
# ────────────────────────────────────────────────────────────

# Order matters: each rule is checked in turn; first match wins.
# 'kind' is the bucket the rows go into in the final dataset.
$sheetMatchers = @(
    @{ kind = 'parts';    test = { param($n) ($n -match 'part') -and ($n -match 'work') } },
    @{ kind = 'works';    test = { param($n) ($n -match 'work') -or  ($n -match 'individual') } },
    @{ kind = 'authors';  test = { param($n) $n -match 'author' } },
    @{ kind = 'periods';  test = { param($n) $n -match 'period' } },
    @{ kind = 'sources';  test = { param($n) $n -match 'source' } }
)

function Get-SheetKind {
    param([string]$Name)
    if ([string]::IsNullOrWhiteSpace($Name)) { return $null }
    $lc = $Name.ToLowerInvariant()
    foreach ($m in $sheetMatchers) {
        if (& $m.test $lc) { return $m.kind }
    }
    return $null
}

# ────────────────────────────────────────────────────────────
# Header → canonical field mapping
# ────────────────────────────────────────────────────────────

# Normalize a header to a comparison key: lowercase, alphanumeric only.
function Normalize-Header { param([string]$H) ($H -replace '[^A-Za-z0-9]', '').ToLowerInvariant() }

# Each kind has a list of canonical fields with header-aliases.
$fieldMaps = @{
    authors = @{
        id          = @('id')
        author_name = @('authorname', 'name')
        life        = @('life', 'authorlife', 'biography', 'bio')
        ciris_url   = @('cirisurl', 'ciris')
        tm_id       = @('tmid')
        tm_uri      = @('tmuri')
        creator     = @('creator', 'collector', 'author_of_record', 'authorrecord')
    }
    works = @{
        id                   = @('id')
        work_title           = @('worktitle', 'title')
        synopsis             = @('synopsis', 'summary')
        quoting_information  = @('quotinginformation', 'quoting', 'quotedin', 'citation')
        ciris_url            = @('cirisurl', 'ciris')
        tm_id                = @('tmid')
        tm_uri               = @('tmuri')
        creator              = @('creator', 'collector')
    }
    parts = @{
        id                   = @('id')
        work_title           = @('worktitle', 'title', 'parttitle')
        synopsis             = @('synopsis', 'summary')
        quoting_information  = @('quotinginformation', 'quoting', 'quotedin', 'citation')
        ciris_url            = @('cirisurl', 'ciris')
        tm_id                = @('tmid')
        tm_uri               = @('tmuri')
        creator              = @('creator', 'collector')
    }
    periods = @{
        corresponding_id    = @('correspondingid', 'corresponding', 'refid', 'targetid')
        period_type         = @('periodtype', 'type')
        start_year_earliest = @('startyearearliest', 'startearliest', 'startfrom')
        start_year_latest   = @('startyearlatest', 'startlatest', 'startto')
        end_year_earliest   = @('endyearearliest', 'endearliest', 'endfrom')
        end_year_latest     = @('endyearlatest', 'endlatest', 'endto')
    }
    sources = @{
        corresponding_id           = @('correspondingid', 'corresponding', 'refid', 'targetid')
        source_type                = @('sourcetype', 'type')
        source_information         = @('sourceinformation', 'information', 'citation', 'source')
        free_internet_resource_url = @('freeinternetresourceurl', 'url', 'link', 'resourceurl')
    }
}

# Build a header→canonical index for a kind+columns.
function Build-HeaderIndex {
    param([string]$Kind, [string[]]$Headers)
    $map = $fieldMaps[$Kind]
    $idx = @{}
    foreach ($h in $Headers) {
        if ([string]::IsNullOrWhiteSpace($h)) { continue }
        $key = Normalize-Header $h
        foreach ($canon in $map.Keys) {
            if ($map[$canon] -contains $key) { $idx[$canon] = $h; break }
        }
    }
    return $idx
}

# ────────────────────────────────────────────────────────────
# Cleaning helpers
# ────────────────────────────────────────────────────────────

function Clean-String {
    param($Value)
    if ($null -eq $Value) { return $null }
    $s = "$Value".Trim()
    if ($s -eq "") { return $null }
    return $s
}

# Source data uses "#url#" or "url#duplicate#" patterns; pick the
# first non-empty token between # marks.
function Clean-Url {
    param($Value)
    $s = Clean-String $Value
    if (-not $s) { return $null }
    if ($s.IndexOf('#') -lt 0) { return $s }
    $tokens = @($s -split '#' | Where-Object { "$_" -ne "" })
    if ($tokens.Count -eq 0) { return $null }
    return ("$($tokens[0])").Trim()
}

# ────────────────────────────────────────────────────────────
# Reading helpers
# ────────────────────────────────────────────────────────────

function Read-AccdbTable {
    param([string]$Path, [string]$Table)
    $conn = New-Object System.Data.OleDb.OleDbConnection("Provider=Microsoft.ACE.OLEDB.16.0;Data Source=$Path")
    $conn.Open()
    try {
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT * FROM [$Table]"
        $reader = $cmd.ExecuteReader()
        try {
            $cols = @()
            for ($i = 0; $i -lt $reader.FieldCount; $i++) { $cols += $reader.GetName($i) }
            $rows = @()
            while ($reader.Read()) {
                $row = [ordered]@{}
                for ($i = 0; $i -lt $reader.FieldCount; $i++) {
                    $v = $reader.GetValue($i)
                    if ($v -is [DBNull]) { $v = $null }
                    $row[$cols[$i]] = $v
                }
                $rows += [pscustomobject]$row
            }
            return @{ headers = $cols; rows = $rows }
        } finally { $reader.Close() }
    } finally { $conn.Close() }
}

function Get-AccdbTableNames {
    param([string]$Path)
    $names = New-Object System.Collections.Generic.List[string]
    $conn = New-Object System.Data.OleDb.OleDbConnection("Provider=Microsoft.ACE.OLEDB.16.0;Data Source=$Path")
    $conn.Open()
    try {
        $schema = $conn.GetSchema("Tables")
        foreach ($r in $schema.Rows) {
            if ($r.TABLE_TYPE -eq "TABLE") { $names.Add([string]$r.TABLE_NAME) }
        }
    } finally { $conn.Close() }
    , $names.ToArray()
}

function Read-XlsxSheet {
    param([object]$Workbook, [string]$SheetName)
    $sheet = $Workbook.Sheets($SheetName)
    $usedRange = $sheet.UsedRange
    $rows = $usedRange.Rows.Count
    $cols = $usedRange.Columns.Count

    $headers = @()
    for ($c = 1; $c -le $cols; $c++) {
        $h = $sheet.Cells.Item(1, $c).Value2
        $headers += [string]$(if ($null -eq $h) { '' } else { $h })
    }

    $result = @()
    for ($r = 2; $r -le $rows; $r++) {
        $row = [ordered]@{}
        $hasAny = $false
        for ($c = 1; $c -le $cols; $c++) {
            $key = $headers[$c - 1]
            if ([string]::IsNullOrWhiteSpace($key)) { continue }
            $v = $sheet.Cells.Item($r, $c).Value2
            if ($v -is [string]) { $v = $v.Trim() }
            if ($null -ne $v -and "$v" -ne "") { $hasAny = $true }
            $row[$key] = $v
        }
        if ($hasAny) { $result += [pscustomobject]$row }
    }
    return @{ headers = $headers; rows = $result }
}

# ────────────────────────────────────────────────────────────
# Row → canonical record
# ────────────────────────────────────────────────────────────

# URL-shaped fields get extra # cleanup; everything else is just trimmed.
$urlFields = @('ciris_url', 'tm_uri', 'free_internet_resource_url')

function To-Canonical {
    param([string]$Kind, [object]$Row, [hashtable]$HeaderIndex)
    $out = [ordered]@{}
    foreach ($canon in $fieldMaps[$Kind].Keys) {
        $sourceHeader = $HeaderIndex[$canon]
        $val = if ($sourceHeader -and $Row.PSObject.Properties[$sourceHeader]) {
            $Row.PSObject.Properties[$sourceHeader].Value
        } else { $null }
        if ($urlFields -contains $canon) { $out[$canon] = Clean-Url $val }
        else                              { $out[$canon] = Clean-String $val }
    }
    return [pscustomobject]$out
}

# ────────────────────────────────────────────────────────────
# Discover & read input files
# ────────────────────────────────────────────────────────────

$inputFiles = @(Get-ChildItem -Path $InputDir -File | Where-Object {
    $_.Extension -in @('.accdb', '.xlsx', '.xls') -and -not $_.Name.StartsWith('~$')
})

if ($inputFiles.Count -eq 0) {
    Write-Warning "No .accdb / .xlsx files found in $InputDir"
}

$buckets = @{ authors = @(); works = @(); parts = @(); periods = @(); sources = @() }
$report  = @()

foreach ($file in $inputFiles) {
    Write-Host "→ $($file.Name)"
    $ext = $file.Extension.ToLowerInvariant()
    $tablesOrSheets = @()

    if ($ext -eq '.accdb') {
        $tablesOrSheets = Get-AccdbTableNames -Path $file.FullName
        if ($tablesOrSheets -is [string]) { $tablesOrSheets = @($tablesOrSheets) }
        Write-Host ("    tables: " + (($tablesOrSheets | ForEach-Object { "'$_'" }) -join ', '))
    } elseif ($ext -in @('.xlsx', '.xls')) {
        # opened later via Excel COM
        $tablesOrSheets = @()
    }

    if ($ext -eq '.accdb') {
        foreach ($t in $tablesOrSheets) {
            $kind = Get-SheetKind $t
            if (-not $kind) { continue }
            $r = Read-AccdbTable -Path $file.FullName -Table $t
            $idx = Build-HeaderIndex -Kind $kind -Headers $r.headers
            $kept = 0
            foreach ($row in $r.rows) {
                $canon = To-Canonical -Kind $kind -Row $row -HeaderIndex $idx
                # require either id or corresponding_id to be useful
                $has = ($canon.PSObject.Properties.Name -contains 'id'                  -and $canon.id) `
                    -or ($canon.PSObject.Properties.Name -contains 'corresponding_id'   -and $canon.corresponding_id)
                if (-not $has) { continue }
                $buckets[$kind] += $canon
                $kept++
            }
            $report += [pscustomobject]@{ file = $file.Name; sheet = $t; kind = $kind; rows = $kept }
        }
    } else {
        $excel = New-Object -ComObject Excel.Application
        $excel.Visible = $false
        $excel.DisplayAlerts = $false
        $wb = $excel.Workbooks.Open($file.FullName)
        try {
            foreach ($sheet in $wb.Sheets) {
                $name = $sheet.Name
                $kind = Get-SheetKind $name
                if (-not $kind) { continue }
                $r = Read-XlsxSheet -Workbook $wb -SheetName $name
                $idx = Build-HeaderIndex -Kind $kind -Headers $r.headers
                $kept = 0
                foreach ($row in $r.rows) {
                    $canon = To-Canonical -Kind $kind -Row $row -HeaderIndex $idx
                    $has = ($canon.PSObject.Properties.Name -contains 'id'                  -and $canon.id) `
                        -or ($canon.PSObject.Properties.Name -contains 'corresponding_id'   -and $canon.corresponding_id)
                    if (-not $has) { continue }
                    $buckets[$kind] += $canon
                    $kept++
                }
                $report += [pscustomobject]@{ file = $file.Name; sheet = $name; kind = $kind; rows = $kept }
            }
        } finally {
            $wb.Close($false)
            $excel.Quit()
            [System.Runtime.Interopservices.Marshal]::ReleaseComObject($wb)    | Out-Null
            [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
            [GC]::Collect()
        }
    }
}

# ────────────────────────────────────────────────────────────
# Deduplicate by primary key
# ────────────────────────────────────────────────────────────

function Deduplicate-By {
    param([object[]]$Items, [string]$Key)
    $seen = @{}
    $out = @()
    foreach ($item in $Items) {
        $k = $item.PSObject.Properties[$Key].Value
        if (-not $k) { continue }
        if ($seen.ContainsKey($k)) { continue }
        $seen[$k] = $true
        $out += $item
    }
    return ,$out
}

$buckets.authors = Deduplicate-By $buckets.authors 'id'
$buckets.works   = Deduplicate-By $buckets.works   'id'
$buckets.parts   = Deduplicate-By $buckets.parts   'id'
# periods + sources have composite identity; keep duplicates as-is

# ────────────────────────────────────────────────────────────
# Report + write
# ────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "── Per-sheet ingestion report ──"
$report | Format-Table -AutoSize

Write-Host ("Final counts: authors={0}, works={1}, parts={2}, periods={3}, sources={4}" -f `
    $buckets.authors.Count, $buckets.works.Count, $buckets.parts.Count, $buckets.periods.Count, $buckets.sources.Count)

$payload = [ordered]@{
    authors = $buckets.authors
    works   = $buckets.works
    parts   = $buckets.parts
    periods = $buckets.periods
    sources = $buckets.sources
}

$json = $payload | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText($OutputFile, $json, (New-Object System.Text.UTF8Encoding $false))
Write-Host ""
Write-Host "Wrote $OutputFile ($((Get-Item $OutputFile).Length) bytes)"
