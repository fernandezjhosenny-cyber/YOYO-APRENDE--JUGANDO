$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$server = Join-Path $root "yoyo_server.py"
python $server
