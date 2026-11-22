import '../../pages/SuperAdminWorkshops.css';

/** Active / Delivered / Cancelled tabs above a request list. `counts` is optional ({ active: 3, ... }). */
export default function QuoteSectionTabs({ sections, value, onChange, counts }) {
  return (
    <div className="wa-tabs" role="tablist" aria-label="Request sections" style={{ marginBottom: '1rem' }}>
      {sections.map(section => (
        <button key={section.id} type="button" role="tab" className="wa-tab" aria-selected={value === section.id} onClick={() => onChange(section.id)}>
          {section.label}
          {counts && counts[section.id] != null && <span className="sv-tab-count">{counts[section.id]}</span>}
        </button>
      ))}
    </div>
  );
}
