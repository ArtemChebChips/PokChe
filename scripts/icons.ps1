Add-Type -AssemblyName System.Drawing
foreach ($size in @(192, 512)) {
  $bitmap = [System.Drawing.Bitmap]::new($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#132c28'))
  $g.ScaleTransform($size / 100.0, $size / 100.0)
  $shape = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $shape.AddBezier(50, 23, 42, 36, 28, 42, 28, 55)
  $shape.AddBezier(28, 55, 28, 69, 44, 73, 50, 62)
  $shape.AddBezier(50, 62, 56, 73, 72, 69, 72, 55)
  $shape.AddBezier(72, 55, 72, 42, 58, 36, 50, 23)
  $shape.CloseFigure()
  $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#dfefaf'))
  $g.FillPath($brush, $shape)
  $g.FillPolygon($brush, [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(48, 59), [System.Drawing.PointF]::new(40, 77), [System.Drawing.PointF]::new(60, 77), [System.Drawing.PointF]::new(52, 59)))
  $bitmap.Save((Join-Path $PSScriptRoot "../public/icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bitmap.Dispose(); $shape.Dispose(); $brush.Dispose()
}
