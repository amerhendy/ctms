// components/dashboard/DepartmentDistribution.jsx
import {ProgressBar} from '@/components/common'
export function DepartmentDistribution({ data = [] }) {
  return (<div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
  <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">
    توزيع المهام حسب القسم
  </h3>
  <div className="space-y-4">
    {data.map((dept) => (
      <div key={dept.department_id}>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600 dark:text-gray-400">
            قسم {dept.department_name}
          </span>
          <span className="font-bold text-gray-900 dark:text-gray-200">
            {dept.count} مهمة
          </span>
        </div>
        {/* ملاحظة: سنفترض وجود منطق لحساب النسبة المئوية بدقة لاحقاً */}
        <ProgressBar value={(dept.count / 10) * 100} />
      </div>
    ))}
  </div>
</div>
  );
}