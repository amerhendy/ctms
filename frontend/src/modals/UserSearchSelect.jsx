import { useState } from 'react'
import { usersApi } from '@/api'
<<<<<<< HEAD
import { PageLoader,Modal, Avatar } from '@/components/common'
import UserContactPopover from '@/components/shared/UserContactPopover'
import clsx from 'clsx'
function UserBlock({userData={}}){
  return(<div className={clsx("flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-gray-100/70 transition-all",
                              "flex items-center ")}>
    <div className="flex items-center gap-3 min-w-0">
      
      <UserContactPopover user={userData}>
        <Avatar name={userData.full_name} size="sm" src={userData.avatar_url} className="border border-gray-100 dark:border-gray-600" />
      </UserContactPopover>
      <div className="leading-tight min-w-0">
        <p className="font-semibold text-gray-950 dark:text-white">{userData.full_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{userData.job_title}</p>
      </div>
    </div>
    <span className="text-[11px] font-mono bg-white px-2 py-1 rounded-md border border-gray-200 text-gray-600 flex-shrink-0">
      #{userData.employee_number}
    </span>
  </div>)
}
=======

>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
export default function UserSearchInput({ onSelect, deptId = null }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  const handleSearch = async (val) => {
    setQuery(val)
    if (val.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    // استخدام الـ API الخاص بك
<<<<<<< HEAD
    const res = await usersApi.listForOthers({ q: val, department_id: deptId, is_active: true })
=======
    const res = await usersApi.list({ q: val, department_id: deptId, is_active: true })
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    setResults(res.data.items || res.data)
    setIsOpen(true)
  }

  return (
    <div className="relative">
      <input
        className="w-full p-2 border rounded-lg dark:bg-gray-800"
        placeholder="ابحث عن الموظف..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border rounded-lg shadow-lg">
          {results.map(user => (
<<<<<<< HEAD
             <button
=======
            <button
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
              key={user.id}
              className="w-full p-2 text-right hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                onSelect(user)
                setIsOpen(false)
                setQuery('')
              }}
            >
<<<<<<< HEAD
              <UserBlock userData={user}/>
            </button>
           
=======
              {user.full_name}
            </button>
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
          ))}
        </div>
      )}
    </div>
  )
}