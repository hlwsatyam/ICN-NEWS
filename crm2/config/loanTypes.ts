export const LOAN_TYPES = [
  { value: 'personal', label: 'Personal Loan' },
  { value: 'business', label: 'Business Loan' },
  { value: 'car', label: 'Car Loan' },
  { value: 'credit', label: 'Credit Loan' },
  { value: 'home', label: 'Home Loan' },
  { value: 'gold', label: 'Gold Loan' },
];

export const getLoanTypeLabel = (type) => {
  const found = LOAN_TYPES.find(t => t.value === type);
  return found ? found.label : type;
};
