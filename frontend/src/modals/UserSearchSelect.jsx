import { useState } from 'react'
import { usersApi } from '@/api'

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
    const res = await usersApi.list({ q: val, department_id: deptId, is_active: true })
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
            <button
              key={user.id}
              className="w-full p-2 text-right hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                onSelect(user)
                setIsOpen(false)
                setQuery('')
              }}
            >
              {user.full_name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}