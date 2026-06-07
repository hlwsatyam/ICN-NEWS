export const PRODUCT_CATEGORIES = [
  { value: 'insurance', label: 'Insurance' },
  { value: 'loan_package', label: 'Loan Package' },
  { value: 'finance_service', label: 'Finance Service' },
  { value: 'credit_service', label: 'Credit Service' },
  { value: 'subscription_service', label: 'Subscription Service' },
];

export const getCategoryLabel = (category) => {
  const found = PRODUCT_CATEGORIES.find(c => c.value === category);
  return found ? found.label : category;
};
