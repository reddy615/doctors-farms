$url = 'https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-parent/'
$c = Invoke-WebRequest -Uri $url -UseBasicParsing
$lines = $c.Content -split "\n"
$versions = @()
foreach ($line in $lines) {
    if ($line -like '*href="*.*.*/*') {
        $mid = $line -split 'href="'[1]
        if ($mid) {
            $ver = $mid.Split('/')[0]
            if ($ver -match '^\d+\.\d+\.\d+$') { $versions += $ver }
        }
    }
}
$versions = $versions | Sort-Object -Unique
$versions | Select-Object -Last 5
