export const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'order', label: 'Order' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'payment_done', label: 'Payment Done' },
  { value: 'hold', label: 'Hold' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
];

export const getLeadStatusLabel = (status) => {
  const found = LEAD_STATUSES.find(s => s.value === status);
  return found ? found.label : status;
};
