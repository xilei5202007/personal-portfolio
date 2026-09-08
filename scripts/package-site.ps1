param([Parameter(Mandatory=$true)][string]$ProjectDirectory,[Parameter(Mandatory=$true)][string]$ArchivePath)
$ErrorActionPreference='Stop'
$project=[IO.Path]::GetFullPath($ProjectDirectory)
$archive=[IO.Path]::GetFullPath($ArchivePath)
$stage=[IO.Path]::GetFullPath((Join-Path $project ('work\package-'+[guid]::NewGuid().ToString('N'))))
$expectedPrefix=(Join-Path $project 'work')+[IO.Path]::DirectorySeparatorChar
if(!$stage.StartsWith($expectedPrefix,[StringComparison]::OrdinalIgnoreCase)){throw 'Packaging stage must stay inside project/work'}
if(Test-Path -LiteralPath $stage){throw 'Refusing to reuse an existing packaging stage'}
# Native Windows packaging for the existing Worker output. This also works when
# the optional Sites plugin's shell helper is not installed on this computer.
$buildDirectory=Join-Path $project 'dist'
if(!(Test-Path -LiteralPath (Join-Path $buildDirectory 'server\index.js') -PathType Leaf)){throw 'Missing Worker entrypoint'}
if(!(Test-Path -LiteralPath (Join-Path $project '.openai\hosting.json') -PathType Leaf)){throw 'Missing Sites metadata'}
$config=Get-Content -Raw -LiteralPath (Join-Path $project '.openai\hosting.json') | ConvertFrom-Json
if($config.static){throw 'This adapter only packages the established Worker build'}
$special=Get-ChildItem -LiteralPath $buildDirectory -Recurse -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }
if($special){throw 'Build output contains a symlink or reparse point'}
New-Item -ItemType Directory -Path $stage | Out-Null
Copy-Item -LiteralPath $buildDirectory -Destination (Join-Path $stage 'dist') -Recurse
$kind='worker'
$metadata=Join-Path $stage 'dist\.openai'
New-Item -ItemType Directory -Force -Path $metadata | Out-Null
if($kind -eq 'worker'){Copy-Item -LiteralPath (Join-Path $project '.openai\hosting.json') -Destination (Join-Path $metadata 'hosting.json')}
if(Test-Path -LiteralPath (Join-Path $project 'drizzle')){throw 'Add migration staging before using this adapter for a database site'}
New-Item -ItemType Directory -Force -Path ([IO.Path]::GetDirectoryName($archive)) | Out-Null
& tar -C $stage -czf $archive dist
if($LASTEXITCODE -ne 0){throw 'Archive creation failed'}
$entries=& tar -tzf $archive
if($LASTEXITCODE -ne 0 -or $entries -notcontains 'dist/.openai/hosting.json'){throw 'Invalid Sites archive metadata'}
if($kind -eq 'worker' -and $entries -notcontains 'dist/server/index.js'){throw 'Missing Worker entrypoint'}
Get-Item -LiteralPath $archive | Select-Object FullName,Length
