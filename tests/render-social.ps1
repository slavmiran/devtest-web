# Raster export of the code-native social card for crawlers that do not accept SVG.
Add-Type -AssemblyName System.Drawing
$repoPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
[xml]$svg = Get-Content -LiteralPath (Join-Path $repoPath 'assets/social-card.svg') -Raw -Encoding UTF8
$bitmap = [System.Drawing.Bitmap]::new(1200,630)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#0e1116'))
foreach ($rect in $svg.svg.rect) {
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($rect.fill))
    $graphics.FillRectangle($brush,[float]$rect.x,[float]$rect.y,[float]$rect.width,[float]$rect.height)
    $brush.Dispose()
}
# Rasterize the same rounded four-petal mark as favicon.svg.
$tile = [System.Drawing.Drawing2D.GraphicsPath]::new()
$tile.AddArc(65,60,28,28,180,90); $tile.AddArc(101,60,28,28,270,90)
$tile.AddArc(101,96,28,28,0,90); $tile.AddArc(65,96,28,28,90,90); $tile.CloseFigure()
$tileBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#071436'))
$tilePen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#1e4fd6'),1.2)
$graphics.FillPath($tileBrush,$tile); $graphics.DrawPath($tilePen,$tile)
for ($petalIndex = 0; $petalIndex -lt 4; $petalIndex++) {
    $drawingState = $graphics.Save()
    $graphics.TranslateTransform(65,60); $graphics.TranslateTransform(32,32)
    $graphics.RotateTransform(90*$petalIndex); $graphics.TranslateTransform(-32,-32)
    $petal = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $petal.AddLine(29,29,20,29); $petal.AddArc(11,11,18,18,90,270)
    $petal.AddLine(29,20,29,29); $petal.CloseFigure()
    $petalColor = if ($petalIndex -eq 3) {'#4ea8ff'} else {'#FFFFFF'}
    $petalBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($petalColor))
    $graphics.FillPath($petalBrush,$petal)
    $petal.Dispose(); $petalBrush.Dispose(); $graphics.Restore($drawingState)
}
$tile.Dispose(); $tileBrush.Dispose(); $tilePen.Dispose()
foreach ($label in $svg.svg.text) {
    $fontStyle = if ($label.'font-weight' -eq '700') {[System.Drawing.FontStyle]::Bold} else {[System.Drawing.FontStyle]::Regular}
    $font = [System.Drawing.Font]::new('Arial',[float]$label.'font-size',$fontStyle,[System.Drawing.GraphicsUnit]::Pixel)
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($label.fill))
    $graphics.DrawString($label.InnerText,$font,$brush,[float]$label.x,([float]$label.y - [float]$label.'font-size'))
    $brush.Dispose(); $font.Dispose()
}
$bitmap.Save((Join-Path $repoPath 'assets/social-card.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose(); $bitmap.Dispose()
