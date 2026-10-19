# Utah Command Windows portable launcher. No downloads or installation.
$ErrorActionPreference = 'Stop'
$listener = $null
$client = $null
try {
    $gameRoot = Join-Path $PSScriptRoot 'game'
    if (!(Test-Path -LiteralPath (Join-Path $gameRoot 'index.html'))) { throw 'Game files missing. Extract the complete ZIP before launching.' }
    # Fixed origin preserves browser saves between launches and package updates.
    $port = 18759
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
    $listener.ExclusiveAddressUse = $true
    try { $listener.Start() } catch { throw 'Cannot start local game address (port 18759). Close an earlier Utah Command launcher and retry. If it still fails, send Larry the error.' }
    $url = "http://127.0.0.1:$port/"
    $routes = @{}
    Get-ChildItem -LiteralPath $gameRoot -Recurse -File | ForEach-Object {
        $relative = $_.FullName.Substring($gameRoot.Length).Replace('\','/')
        $routes[$relative] = $_.FullName
    }
    $routes['/'] = Join-Path $gameRoot 'index.html'
    $mime = @{ '.html'='text/html; charset=utf-8'; '.js'='application/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json'; '.webmanifest'='application/manifest+json'; '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg' }
    $edgeCandidates = @(
        (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'),
        (Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'),
        (Join-Path $env:LOCALAPPDATA 'Microsoft\Edge\Application\msedge.exe')
    )
    $edge = $edgeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if ($edge) { Start-Process -FilePath $edge -ArgumentList "--app=$url" }
    else { Start-Process $url }
    Write-Host ''
    Write-Host 'UTAH COMMAND - WINDOWS PORTABLE BETA' -ForegroundColor Green
    Write-Host "Game address: $url"
    Write-Host 'Keep this launcher window open while playing.'
    Write-Host 'To quit: close the game window, then close this launcher window.'
    Write-Host 'No internet connection is required. Only this computer can connect.'
    Write-Host 'If the game window did not open, paste the game address into Edge.'
    Write-Host ''
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 1500
            $client.SendTimeout = 5000
            $stream = $client.GetStream()
            $header = [System.Text.StringBuilder]::new()
            while ($header.Length -lt 16384) {
                $b = $stream.ReadByte()
                if ($b -lt 0) { break }
                [void]$header.Append([char]$b)
                if ($header.Length -ge 4 -and $header.ToString().EndsWith("`r`n`r`n")) { break }
            }
            $first = ($header.ToString() -split "`r`n")[0]
            $parts = $first -split ' '
            $code = '400 Bad Request'
            $type = 'text/plain; charset=utf-8'
            $body = [System.Text.Encoding]::UTF8.GetBytes('Bad request')
            $method = if ($parts.Length -gt 0) { $parts[0] } else { '' }
            if ($parts.Length -eq 3 -and $parts[2] -match '^HTTP/1\.[01]$') {
                if ($method -ne 'GET' -and $method -ne 'HEAD') {
                    $code = '405 Method Not Allowed'
                    $body = [System.Text.Encoding]::UTF8.GetBytes('Only GET and HEAD are supported.')
                } else {
                    $path = [System.Uri]::UnescapeDataString(($parts[1] -split '\?',2)[0])
                    if ($routes.ContainsKey($path)) {
                        $file = $routes[$path]
                        $code = '200 OK'
                        $extension = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
                        $type = if ($mime.ContainsKey($extension)) { $mime[$extension] } else { 'application/octet-stream' }
                        $body = [System.IO.File]::ReadAllBytes($file)
                    } else {
                        $code = '404 Not Found'
                        $body = [System.Text.Encoding]::UTF8.GetBytes('Game file not found.')
                    }
                }
            }
            $response = "HTTP/1.1 $code`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`nConnection: close`r`n`r`n"
            $bytes = [System.Text.Encoding]::ASCII.GetBytes($response)
            $stream.Write($bytes,0,$bytes.Length)
            if ($method -ne 'HEAD') { $stream.Write($body,0,$body.Length) }
            $stream.Flush()
        } catch {
            # A browser may cancel or open an unused connection. Continue serving.
        } finally {
            $client.Close()
            $client = $null
        }
    }
} catch {
    Write-Host ''
    Write-Host 'Utah Command could not start:' -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host 'Send this message to larrykuzniak@mac.com if you need help.'
    [void](Read-Host 'Press Enter to close')
} finally {
    if ($client) { $client.Close() }
    if ($listener) { $listener.Stop() }
}
