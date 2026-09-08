param([Parameter(Mandatory=$true)][string]$ProjectDirectory,[Parameter(Mandatory=$true)][string]$ArchivePath)
$ErrorActionPreference='Stop'
$project=[IO.Path]::GetFullPath($ProjectDirectory)
$archive=[IO.Path]::GetFullPath($ArchivePath)
$stage=[IO.Path]::GetFullPath((Join-Path $project ('work\package-'+[guid]::NewGuid().ToString('N'))))
$expectedPrefix=(Join-Path $project 'work')+[IO.Path]::DirectorySeparatorChar
if(!$stage.StartsWith($expectedPrefix,[StringComparison]::OrdinalIgnoreCase)){throw 'Packaging stage must stay inside project/work'}
if(Test-Path -LiteralPath $stage){throw 'Refusing to reuse an existing packaging stage'}
$helper='C:\Users\lenovo\.codex\plugins\cache\openai-bundled\sites\0.1.57\skills\sites-hosting\scripts\prepare-site-build.cjs'
# Native Windows equivalent of package-site.sh using its shared validation helper.
$kind=& node $helper $project (Join-Path $stage 'dist')
if($LASTEXITCODE -ne 0){throw 'Sites build preparation failed'}
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
