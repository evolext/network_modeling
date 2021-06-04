# Скрипт на сборку файлов расчета

if ($args[0] -eq "hydro") {
    $Folder = "hydraulic"
    $SourcePath = "C:\Users\evole\PycharmProjects\Hydraulic calc (GGA)" 
}
else {
    $Folder = "piezometric"
    $SourcePath = "C:\Users\evole\PycharmProjects\Finding routes in network graph"
}

Set-Location -Path "$($PSScriptRoot)\calculationPrograms\$($Folder)\source"
Copy-Item -Path $SourcePath\*.py -Destination . 
cmd.exe /c "pyinstaller -F main.py"
Move-Item -Path ".\dist\main.exe" -Destination "..\" -Force
Remove-Item * -Exclude *.py -Recurse
Set-Location -Path $PSScriptRoot