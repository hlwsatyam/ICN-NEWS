export const PRODUCT_UNITS = [
  { value: 'piece', label: 'Piece' },
  { value: 'package', label: 'Package' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'service', label: 'Service' },
];

export const getUnitLabel = (unit) => {
  const found = PRODUCT_UNITS.find(u => u.value === unit);
  return found ? found.label : unit;
};
