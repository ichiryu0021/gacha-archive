param(
  [Parameter(Mandatory = $true)][string]$ImagePath,
  [int]$Scale = 0
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$ProgressPreference = 'SilentlyContinue'

Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await($WinRtTask, $ResultType) {
  $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
  $netTask = $asTask.Invoke($null, @($WinRtTask))
  $netTask.Wait(-1) | Out-Null
  $netTask.Result
}

[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapTransform, Windows.Graphics, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Media, ContentType = WindowsRuntime] | Out-Null

$fullPath = (Resolve-Path -LiteralPath $ImagePath).Path
$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($fullPath)) ([Windows.Storage.StorageFile])
$stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])

$width = [int]$decoder.PixelWidth
$height = [int]$decoder.PixelHeight
if ($Scale -le 0) {
  if ($width -lt 1200) { $Scale = 2 }
  elseif ($width -lt 1800) { $Scale = 1.5 }
  else { $Scale = 1 }
}
if ($Scale -lt 1) { $Scale = 1 }
$targetWidth = [uint32][Math]::Min(9000, [Math]::Round($width * $Scale))
$targetHeight = [uint32][Math]::Min(9000, [Math]::Round($height * $Scale))
$actualScale = [double]$targetWidth / $width

$transform = [Windows.Graphics.Imaging.BitmapTransform]::new()
$transform.ScaledWidth = $targetWidth
$transform.ScaledHeight = $targetHeight
$transform.InterpolationMode = [Windows.Graphics.Imaging.BitmapInterpolationMode]::Fant

$bitmap = Await ($decoder.GetSoftwareBitmapAsync(
  [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8,
  [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied,
  $transform,
  [Windows.Graphics.Imaging.ExifOrientationMode]::IgnoreExifOrientation,
  [Windows.Graphics.Imaging.ColorManagementMode]::DoNotColorManage
)) ([Windows.Graphics.Imaging.SoftwareBitmap])

$engine = $null
try {
  $language = [Windows.Globalization.Language]::new('zh-Hans-CN')
  $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($language)
} catch { $engine = $null }
if ($null -eq $engine) {
  $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
}
if ($null -eq $engine) {
  $available = ([Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages | ForEach-Object { $_.LanguageTag }) -join ', '
  throw "Windows OCR 没有中文识别引擎。已安装语言：$available。请在 Windows 设置 → 时间和语言 → 语言和区域 中安装中文（简体）的 OCR/手写组件。"
}

$result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
$lines = New-Object System.Collections.Generic.List[object]
foreach ($line in $result.Lines) {
  $words = New-Object System.Collections.Generic.List[object]
  foreach ($word in $line.Words) {
    $r = $word.BoundingRect
    $words.Add([PSCustomObject]@{
      text = $word.Text
      x = [Math]::Round($r.X / $actualScale, 1)
      y = [Math]::Round($r.Y / $actualScale, 1)
      w = [Math]::Round($r.Width / $actualScale, 1)
      h = [Math]::Round($r.Height / $actualScale, 1)
    })
  }
  $lines.Add([PSCustomObject]@{
    text = $line.Text
    words = @($words.ToArray())
  })
}

$payload = [PSCustomObject]@{
  width = $width
  height = $height
  scale = [Math]::Round($actualScale, 2)
  language = 'zh-Hans-CN'
  lines = @($lines.ToArray())
}
$payload | ConvertTo-Json -Depth 8 -Compress
