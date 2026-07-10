import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

const getStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
const colors = ['bg-error-500', 'bg-error-500', 'bg-accent-500', 'bg-secondary-500', 'bg-success-500'];

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  const score = getStrength(password);
  const index = Math.min(score, 4);

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= index ? colors[index] : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${index <= 1 ? 'text-error-600' : index <= 2 ? 'text-accent-600' : 'text-success-600'}`}>
        {labels[index]}
      </p>
      <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
        <li className={password.length >= 8 ? 'text-success-600' : ''}>• At least 8 characters</li>
        <li className={/[A-Z]/.test(password) && /[0-9]/.test(password) ? 'text-success-600' : ''}>
          • Uppercase letter and number
        </li>
        <li className={/[^A-Za-z0-9]/.test(password) ? 'text-success-600' : ''}>• A special character</li>
      </ul>
    </div>
  );
};