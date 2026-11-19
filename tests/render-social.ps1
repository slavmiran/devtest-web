# Raster export of the code-native social card for crawlers that do not accept SVG.
Add-Type -AssemblyName System.Drawing
$repoPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
[xml]$svg = Get-Content -LiteralPath (Join-Path $repoPath 'assets/social-card.svg') -Raw
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
foreach ($label in $svg.svg.text) {
    $fontStyle = if ($label.'font-weight' -eq '700') {[System.Drawing.FontStyle]::Bold} else {[System.Drawing.FontStyle]::Regular}
    $font = [System.Drawing.Font]::new('Arial',[float]$label.'font-size',$fontStyle,[System.Drawing.GraphicsUnit]::Pixel)
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($label.fill))
    $graphics.DrawString($label.InnerText,$font,$brush,[float]$label.x,([float]$label.y - [float]$label.'font-size'))
    $brush.Dispose(); $font.Dispose()
}
$bitmap.Save((Join-Path $repoPath 'assets/social-card.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose(); $bitmap.Dispose()
