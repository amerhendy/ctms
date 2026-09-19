// components/common/StatDisplayCard.jsx
import { clsx } from 'clsx';
import { Link } from 'react-router-dom'
export function StatDisplayCard({ icon: Icon, title, children, className, cardsize = 5, onClick, to ,cols=1}) {
  const colMap = {
    "1": "col-span-full md:col-span-1",
    "2": "col-span-full md:col-span-2",
    "3": "col-span-full md:col-span-3",
    "4": "col-span-full md:col-span-4",
  };

  const colspan = colMap[cols] || "col-span-full md:col-span-1";

  
  const content = (
    <div className={clsx('card transition-all duration-200', `p-${cardsize}`, onClick && 'cursor-pointer hover:shadow-md hover:scale-[1.02]', className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 border-t-white/40 shadow-xl text-white flex items-center justify-center">
          <Icon className="w-5 h-5 " />
        </div>
        <h3 className="font-bold dark:text-white/90">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-white">{children}</div>
    </div>
  );

  // إذا تم تمرير خاصية 'to'، نغلف الكارد بـ Link
  return to ? 
            <Link className={clsx(colspan)} to={to}>{content}</Link> : 
            <div className={clsx(colspan)} onClick={onClick}>{content}</div>;
}