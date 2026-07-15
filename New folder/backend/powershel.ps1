$base = "C:\Users\sinaiwater\.docker\cagent\working_directories\docker-gordon-v7\d9bf2407-0c4e-4940-83d2-0c98d8d32804\default\backend"

$files = @(
    "app\models\TaskWorkflowModel.py",
    "app\models\TaskWorkflowStepDependency_Model.py",
    "app\models\TaskWorkflowStepModel.py",
    "app\models\WorkflowTemplateModel.py",
    "app\models\WorkflowTemplateStepModel.py",
	"app\models\Task.py",
	
	"app\schemas\TaskWorkflow_schema.py",
	"app\schemas\TaskWorkflowStep_schema.py",
	"app\schemas\WorkflowTemplate_schema.py",
	"app\schemas\WorkflowTemplateStep_schema.py",
	
    "app\services\TaskWorkflow_service.py",
	"app\services\TaskWorkflowStep_service.py",
	"app\services\WorkflowStepDependencyService.py",
	"app\services\WorkflowTemplateService.py",
	"app\services\WorkflowTemplateStepService.py",
	"app\services\automation.py",
	
	"app\repositories\taskWorkFlow_repo.py",
	"app\repositories\TaskWorkflowStep_repo.py",
	"app\repositories\TaskWorkflowStepDependency_repo.py",
	"app\repositories\WorkflowTemplate_repo.py",
	"app\repositories\WorkflowTemplateStep_rep.py",
	
	
    "app\api\v1\endpoints\TaskWorkflow_route.py",
	"app\api\v1\endpoints\TaskWorkflowStep_route.py",
	"app\api\v1\endpoints\WorkflowTemplate_route.py",
	"app\api\v1\endpoints\WorkflowTemplateStep_route.py",
	"app\api\v1\endpoints\workflow_router.py",
	
    "app\db\enums.py"
)

$out = ""
foreach ($f in $files) {
    $full = "$base\$f"
    $out += "`n`n===== $f =====`n"
    $out += Get-Content $full -Raw -Encoding UTF8
}

$out | Out-File backend_bundle.txt -Encoding UTF8