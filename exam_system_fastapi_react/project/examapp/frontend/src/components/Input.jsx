export default function Input({ label, className = '', ...props }) {
  return (
    <div className="mb-3.5">
      {label && <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>}
      <input className={`input-field ${className}`} {...props} />
    </div>
  )
}
