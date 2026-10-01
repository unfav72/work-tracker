import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth } from 'date-fns';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));



  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-text">
          <h1 className="header-greeting">📅 Calendar</h1>
          <p className="header-date">Track your progress over time.</p>
        </div>
      </header>

      <div className="calendar-container" style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', marginTop: '2rem' }}>
        <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={prevMonth} className="action-btn"><ChevronLeft /></button>
          <h2 style={{ margin: 0 }}>{format(currentDate, 'MMMM yyyy')}</h2>
          <button onClick={nextMonth} className="action-btn"><ChevronRight /></button>
        </div>
        
        <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{day}</div>
          ))}
          
          {/* Empty slots for offset */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {daysInMonth.map((date, i) => {
            return (
              <div 
                key={i} 
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-primary)',
                  borderRadius: '0.5rem',
                  border: isToday(date) ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  color: isToday(date) ? 'var(--accent-primary)' : 'inherit',
                  fontWeight: isToday(date) ? 'bold' : 'normal'
                }}
              >
                {format(date, 'd')}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
