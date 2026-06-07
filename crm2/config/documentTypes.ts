export const DOCUMENT_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'salary_slip', label: 'Salary Slip' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'bank_statement', label: 'Bank Statement' },
];

export const getDocumentTypeLabel = (type) => {
  const found = DOCUMENT_TYPES.find(t => t.value === type);
  return found ? found.label : type;
};
