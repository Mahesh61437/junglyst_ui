import { ChevronRight } from 'lucide-react';
import { formatINR } from '../../utils/workshops';
import { QUOTE_STATUS, groupByDay } from '../../utils/serviceQuotes';
import { QuoteStatusPill } from './MyQuotes';
import '../../pages/Services.css';

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

function Cell({ label, children, hint }) {
  return (
    <div className="sv-rq-cell">
      <span className="sv-rq-label">{label}</span>
      <span className="sv-rq-value">{children}</span>
      {hint && <span className="sv-rq-hint">{hint}</span>}
    </div>
  );
}

function RequestRow({ item, showSeller, onOpen }) {
  const accent = (QUOTE_STATUS[item.status] || QUOTE_STATUS.submitted).fg;
  const time = new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return (
    <button type="button" className="sv-rq" style={{ '--sv-rq-accent': accent }} onClick={() => onOpen(item.id)} aria-label={`Open request ${item.reference}`}>
      <div className="sv-rq-head">
        <span className="sv-rq-ref">{item.reference}</span>
        <span className="sv-rq-time">{time}</span>
        <QuoteStatusPill status={item.status} />
        <span className="sv-rq-open">Open <ChevronRight size={15} aria-hidden="true" /></span>
      </div>
      <div className="sv-rq-body">
        <Cell label="Service" hint={item.group_name}>{item.offering_name}</Cell>
        <Cell label="Customer" hint={[item.contact_phone, item.state].filter(Boolean).join(' · ')}>{item.contact_name}</Cell>
        <Cell label="Budget">{formatINR(item.budget_min)} – {formatINR(item.budget_max)}</Cell>
        {item.final_amount
          ? <Cell label="Total paid" hint="Final amount">{formatINR(item.final_amount, { decimals: 2 })}</Cell>
          : <Cell label="Quote">{item.total_amount ? formatINR(item.total_amount, { decimals: 2 }) : <em className="sv-rq-muted">Not set</em>}</Cell>}
        {showSeller && <Cell label="Seller">{item.assigned_seller?.store_name || <em className="sv-rq-muted">Not assigned</em>}</Cell>}
      </div>
    </button>
  );
}

/**
 * Quote requests as cards. Grouped under a date header (like the orders list)
 * when `groupByDate` is set, i.e. when the list is in date order.
 */
export default function QuoteRequestList({ items, onOpen, showSeller = true, groupByDate = true }) {
  const groups = groupByDate ? groupByDay(items) : [{ key: 'all', label: null, items }];
  return (
    <div className="sv-rq-groups">
      {groups.map(group => (
        <section key={group.key} aria-label={group.label || 'Requests'}>
          {group.label && (
            <h3 className="sv-rq-date">{group.label}<span>{plural(group.items.length, 'request')}</span></h3>
          )}
          <div className="sv-rq-list" role="list">
            {group.items.map(item => (
              <div role="listitem" key={item.id}><RequestRow item={item} showSeller={showSeller} onOpen={onOpen} /></div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
