import { useQuery } from '@tanstack/react-query';
import { orgApi } from '@/api';
import { useState, useMemo } from 'react';
import { X, Loader2, Search, Building2, ChevronDown } from 'lucide-react';

export default function LocationDepartmentsModal({ loc, onClose }) {
  const [search, setSearch] = useState('');

  // استعلام البيانات
  const { data, isLoading, isError } = useQuery({
    queryKey: ['loc-depts', loc?.id],
    queryFn: () => orgApi.getDeptTree({ location_id: loc.id }).then(r => r.data),
    enabled: !!loc?.id,
  }); 

  // فلترة البيانات: نبحث في الاسم
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    // دالة تكرارية للبحث داخل الشجرة
    const filterTree = (items) => {
      return items.reduce((acc, item) => {
        const match = item.name?.includes(search);
        const children = filterTree(item.children || []);
        
        if (match || children.length > 0) {
          acc.push({ ...item, children });
        }
        return acc;
      }, []);
    };

    return filterTree(data);
  }, [data, search]);

  if (!loc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-xl border dark:border-gray-800 flex flex-col max-h-[85vh]">
        
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-800">
          <h2 className="text-lg font-bold dark:text-white">أقسام {loc.name}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X className="w-5 h-5 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          <div className="relative mb-4">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث في الأقسام..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin w-8 h-8 text-primary-600" /></div>
          ) : (
            <div className="space-y-2">
              {filteredData.map(dept => (
                <DepartmentItem key={dept.id} dept={dept} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// مكون فرعي لعرض القسم وأبنائه بشكل متداخل
function DepartmentItem({ dept }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Building2 className="w-4 h-4 text-primary-600" />
        <div className="flex-1">
          <p className="text-sm font-medium">{dept.name}</p>
          <p className="text-[10px] text-gray-500">{dept.job_level?.title || 'قسم رئيسي'}</p>
        </div>
      </div>
      {dept.children?.length > 0 && (
        <div className="pr-6 space-y-1 border-r border-gray-200 dark:border-gray-700">
          {dept.children.map(child => (
            <DepartmentItem key={child.id} dept={child} />
          ))}
        </div>
      )}
    </div>
  );
}