Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 1. إنشاء النافذة الرئيسية
$form = New-Object System.Windows.Forms.Form
$form.Text = "مجمع الملفات الذكي مع شجرة المشروع 🌲"
$form.Size = New-Object System.Drawing.Size(560, 640) # زيادة الطول قليلاً للحقوق
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.KeyPreview = $true

# متغيرات عامة لحفظ المسارات
$global:projectFolder = ""
$global:masterFileList = New-Object System.Collections.Generic.List[string]

# ================= القسم الأول: اختيار مجلد المشروع الكامل =================
$btnSelectFolder = New-Object System.Windows.Forms.Button
$btnSelectFolder.Text = "📁 1. اختر مجلد المشروع بالكامل (مثال: src)..."
$btnSelectFolder.Location = New-Object System.Drawing.Point(20, 15)
$btnSelectFolder.Size = New-Object System.Drawing.Size(500, 35)
$btnSelectFolder.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($btnSelectFolder)

$txtFolderPath = New-Object System.Windows.Forms.TextBox
$txtFolderPath.Location = New-Object System.Drawing.Point(20, 55)
$txtFolderPath.Size = New-Object System.Drawing.Size(500, 25)
$txtFolderPath.ReadOnly = $true
$txtFolderPath.Text = "لم يتم اختيار مجلد المشروع بعد..."
$form.Controls.Add($txtFolderPath)

$btnSelectFolder.Add_Click({
    $folderDialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $folderDialog.Description = "اختر مجلد المشروع الرئيسي لتوليد الشجرة الكاملة له"
    if ($folderDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $global:projectFolder = $folderDialog.SelectedPath
        $txtFolderPath.Text = $global:projectFolder
    }
})

# ================= القسم الثاني: اختيار الملفات المراد دمج أكوادها =================
$btnBrowseFiles = New-Object System.Windows.Forms.Button
$btnBrowseFiles.Text = "📄 2. إضافة ملفات محددة لدمج أكوادها..."
$btnBrowseFiles.Location = New-Object System.Drawing.Point(20, 100)
$btnBrowseFiles.Size = New-Object System.Drawing.Size(500, 35)
$btnBrowseFiles.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($btnBrowseFiles)

$listBox = New-Object System.Windows.Forms.ListBox
$listBox.Location = New-Object System.Drawing.Point(20, 145)
$listBox.Size = New-Object System.Drawing.Size(500, 160)
$form.Controls.Add($listBox)

$lblHint = New-Object System.Windows.Forms.Label
$lblHint.Text = "💡 لحذف أي ملف من قائمة الأكواد: حدده واضغط Delete من الكيبورد."
$lblHint.Location = New-Object System.Drawing.Point(20, 310)
$lblHint.Size = New-Object System.Drawing.Size(500, 20)
$lblHint.ForeColor = [System.Drawing.Color]::DimGray
$form.Controls.Add($lblHint)

$btnBrowseFiles.Add_Click({
    $fileDialog = New-Object System.Windows.Forms.OpenFileDialog
    $fileDialog.MultiSelect = $true
    $fileDialog.Filter = "All Files (*.*)|*.*"
    
    if ($fileDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        foreach ($fullPath in $fileDialog.FileNames) {
            if (-not $global:masterFileList.Contains($fullPath)) {
                $global:masterFileList.Add($fullPath)
                $parentDir = [System.IO.Path]::GetFileName([System.IO.Path]::GetDirectoryName($fullPath))
                $fileName = [System.IO.Path]::GetFileName($fullPath)
                $listBox.Items.Add("[$parentDir] -> $fileName")
            }
        }
    }
})

$listBox.Add_KeyDown({
    param($sender, $e)
    if ($e.KeyCode -eq [System.Windows.Forms.Keys]::Delete) {
        $selectedIndex = $listBox.SelectedIndex
        if ($selectedIndex -ge 0) {
            $global:masterFileList.RemoveAt($selectedIndex)
            $listBox.Items.RemoveAt($selectedIndex)
        }
    }
})

# ================= القسم الثالث: التسمية والتجميع الفعلي =================
$lblInput = New-Object System.Windows.Forms.Label
$lblInput.Text = "أدخل اسم الملف الناتج (بدون .txt):"
$lblInput.Location = New-Object System.Drawing.Point(20, 345)
$lblInput.Size = New-Object System.Drawing.Size(500, 20)
$form.Controls.Add($lblInput)

$txtFileName = New-Object System.Windows.Forms.TextBox
$txtFileName.Location = New-Object System.Drawing.Point(20, 370)
$txtFileName.Size = New-Object System.Drawing.Size(500, 25)
$txtFileName.Text = "full_project_bundle"
$form.Controls.Add($txtFileName)

$btnRun = New-Object System.Windows.Forms.Button
$btnRun.Text = "تجميع الأكواد وتوليد الشجرة الكاملة للموقع 🚀"
$btnRun.Location = New-Object System.Drawing.Point(20, 420)
$btnRun.Size = New-Object System.Drawing.Size(500, 50)
$btnRun.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$btnRun.BackColor = [System.Drawing.Color]::LightGreen

# ================= 🆕 القسم الرابع: شريط الحقوق وبيانات الاتصال بالأسفل =================
$panelCredits = New-Object System.Windows.Forms.Panel
$panelCredits.Location = New-Object System.Drawing.Point(0, 490)
$panelCredits.Size = New-Object System.Drawing.Size(560, 110)
$panelCredits.BackColor = [System.Drawing.Color]::FromArgb(245, 245, 245)

$lblDeveloper = New-Object System.Windows.Forms.Label
$lblDeveloper.Text = "🧑‍💻 المطور: [عامر هندى]"
$lblDeveloper.Font = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
$lblDeveloper.Location = New-Object System.Drawing.Point(20, 15)
$lblDeveloper.Size = New-Object System.Drawing.Size(500, 20)

$lblContact = New-Object System.Windows.Forms.Label
$lblContact.Text = "📧 للتواصل: [amer.hendy@yahoo.com]"
$lblContact.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$lblContact.Location = New-Object System.Drawing.Point(20, 40)
$lblContact.Size = New-Object System.Drawing.Size(500, 20)
$lblContact.ForeColor = [System.Drawing.Color]::DarkBlue

$panelCredits.Controls.Add($lblDeveloper)
$panelCredits.Controls.Add($lblContact)
$form.Controls.Add($panelCredits)

# دالة توليد الشجرة للمجلد بالكامل
function Get-FullFolderTree ($rootPath) {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("📦 FULL PROJECT STRUCTURE ($([System.IO.Path]::GetFileName($rootPath))):")
    
    function Walk-Directory ($currentPath, $indent = "") {
        $items = Get-ChildItem $currentPath | Where-Object { $_.Name -ne "node_modules" -and $_.Name -ne ".git" }
        $count = $items.Count
        
        for ($i = 0; $i -lt $count; $i++) {
            $item = $items[$i]
            $isLast = ($i -eq $count - 1)
            if ($isLast) { $connector = "┗━ " } else { $connector = "┣━ " }
            
            if ($item.PSIsContainer) {
                [void]$sb.AppendLine("$indent$connector📂 $($item.Name)")
                if ($isLast) { $nextIndent = $indent + "    " } else { $nextIndent = $indent + "┃   " }
                Walk-Directory $item.FullName $nextIndent
            } else {
                [void]$sb.AppendLine("$indent$connector📜 $($item.Name)")
            }
        }
    }
    Walk-Directory $rootPath ""
    return $sb.ToString()
}

$btnRun.Add_Click({
    if ([string]::IsNullOrEmpty($global:projectFolder) -or -not (Test-Path $global:projectFolder)) {
        [System.Windows.Forms.MessageBox]::Show("رجاءً اختر مجلد المشروع (الخطوة 1) أولاً لتوليد الشجرة!", "تنبيه", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
        return
    }
    
    if ($global:masterFileList.Count -eq 0) {
        [System.Windows.Forms.MessageBox]::Show("رجاءً اختر بعض الملفات (الخطوة 2) لدمج أكوادها!", "تنبيه", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
        return
    }

    $name = $txtFileName.Text.Trim()
    if ([string]::IsNullOrEmpty($name)) { $name = "full_project_bundle" }
    if (-not $name.EndsWith(".txt")) { $name = "$name.txt" }
    
    $out = "==============================================`r`n"
    $out += Get-FullFolderTree $global:projectFolder
    $out += "==============================================`r`n`r`n"
    
    $out += "================ SELECTED FILES CODE ===============`r`n"
    foreach ($fullPath in $global:masterFileList) {
        if (Test-Path $fullPath) {
            $out += "`n`n===== Src: $fullPath =====`n"
            $out += Get-Content $fullPath -Raw -Encoding UTF8
        }
    }
    
    $savePath = Join-Path $PSScriptRoot $name
    $out | Out-File $savePath -Encoding utf8
    
    [System.Windows.Forms.MessageBox]::Show("✅ تم بنجاح توليد شجرة الموقع كاملة ودمج ملفات الأكواد المحددة!", "نجاح العملية", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
})

$form.Controls.Add($btnRun)
$form.ShowDialog() | Out-Null

