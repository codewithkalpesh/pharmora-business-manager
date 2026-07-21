// src/pages/purchases/DistributorForm.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Building2, User, Phone, Mail, FileText, MapPin, 
  CalendarClock, Loader2, CheckCircle2, Sparkles 
} from 'lucide-react';
import { purchaseApi } from '../../api/purchase.api';

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const formSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  gstNumber: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? '' : typeof val === 'string' ? val.trim().toUpperCase() : val),
    z.string().regex(gstRegex, 'Invalid GSTIN format (e.g. 27AAAAA1111A1Z1)').or(z.literal(''))
  ),
  creditDays: z.coerce.number().int().min(0, 'Must be 0 or positive').default(30),
});

const Field = ({ label, icon: Icon, iconColor = '#10b981', error, extraHint, children, span = 1 }) => (
  <div style={{ gridColumn: `span ${span}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: '0.6875rem', fontWeight: 600, color: '#64748b',
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {Icon && <Icon size={11} color={iconColor} />}
        {label}
      </label>
      {extraHint}
    </div>
    {children}
    {error && <p style={{ fontSize: '0.6875rem', color: '#ef4444', marginTop: 2, fontWeight: 500 }}>{error}</p>}
  </div>
);

const inputStyle = (hasError) => ({
  width: '100%',
  height: 36,
  padding: '0 10px',
  background: '#f8fafc',
  border: `1.5px solid ${hasError ? '#ef4444' : 'rgba(148,163,184,0.18)'}`,
  borderRadius: 8,
  color: '#0f172a',
  fontSize: '0.8125rem',
  fontWeight: 500,
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  transition: 'all 0.15s ease',
});

const textareaStyle = {
  width: '100%',
  padding: '6px 10px',
  background: '#f8fafc',
  border: '1.5px solid rgba(148,163,184,0.18)',
  borderRadius: 8,
  color: '#0f172a',
  fontSize: '0.8125rem',
  resize: 'none',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  lineHeight: 1.4,
};

const CREDIT_PRESETS = [7, 15, 30, 45, 60];

export default function DistributorForm({ initialData, onSuccess, onClose }) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusField, setFocusField] = useState(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name || '',
          contactPerson: initialData.contactPerson || '',
          phone: initialData.phone || '',
          email: initialData.email || '',
          address: initialData.address || '',
          gstNumber: initialData.gstNumber || '',
          creditDays: initialData.creditDays ?? 30,
        }
      : {
          name: '',
          contactPerson: '',
          phone: '',
          email: '',
          address: '',
          gstNumber: '',
          creditDays: 30,
        },
  });

  const watchedGst = watch('gstNumber') || '';
  const watchedCreditDays = Number(watch('creditDays')) || 0;
  const isValidGst = gstRegex.test(watchedGst.trim().toUpperCase());

  const onSubmit = async (values) => {
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await purchaseApi.updateDistributor(initialData.id, values);
      } else {
        await purchaseApi.createDistributor(values);
      }
      onSuccess();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && typeof data.errors === 'object') {
        const msgList = Object.entries(data.errors).map(([field, msgs]) => {
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
          return `${fieldName}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
        });
        setError(msgList.join(' | '));
      } else {
        setError(data?.message || 'Failed to save distributor profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const regWithFocus = (name, reg) => ({
    ...reg,
    onFocus: () => setFocusField(name),
    onBlur:  () => setFocusField(null),
    style: { 
      ...inputStyle(!!errors[name]), 
      ...(focusField === name ? { borderColor: '#10b981', boxShadow: '0 0 0 3px rgba(16,185,129,0.12)', background: '#ffffff' } : {}) 
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, marginBottom: 10,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#dc2626', fontSize: '0.75rem', fontWeight: 500,
        }}>
          {error}
        </div>
      )}

      {/* Grid container for zero-scroll compact layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
        
        {/* Row 1 */}
        <Field label="Company / Business Name *" icon={Building2} iconColor="#059669" error={errors.name?.message}>
          <input
            type="text"
            autoFocus
            placeholder="e.g. Vardhaman Pharma Agencies"
            {...regWithFocus('name', register('name'))}
          />
        </Field>

        <Field label="Contact Person" icon={User} iconColor="#3b82f6" error={errors.contactPerson?.message}>
          <input
            type="text"
            placeholder="e.g. Mr. Rajesh Kumar"
            {...regWithFocus('contactPerson', register('contactPerson'))}
          />
        </Field>

        {/* Row 2 */}
        <Field label="Phone Number" icon={Phone} iconColor="#2563eb" error={errors.phone?.message}>
          <input
            type="text"
            placeholder="e.g. +91 98765 43210"
            {...regWithFocus('phone', register('phone'))}
          />
        </Field>

        <Field 
          label="Credit Terms (Days)" 
          icon={CalendarClock} 
          iconColor="#d97706" 
          error={errors.creditDays?.message}
          extraHint={
            <div style={{ display: 'flex', gap: 4 }}>
              {CREDIT_PRESETS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setValue('creditDays', days)}
                  style={{
                    padding: '1px 5px', borderRadius: 4, fontSize: '0.625rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: watchedCreditDays === days ? '#dcfce7' : '#f1f5f9',
                    color: watchedCreditDays === days ? '#047857' : '#64748b',
                    border: `1px solid ${watchedCreditDays === days ? '#86efac' : 'transparent'}`,
                  }}
                >
                  {days}d
                </button>
              ))}
            </div>
          }
        >
          <input
            type="number"
            placeholder="30"
            {...regWithFocus('creditDays', register('creditDays'))}
          />
        </Field>

        {/* Row 3 */}
        <Field 
          label="GSTIN Number" 
          icon={FileText} 
          iconColor="#7c3aed" 
          error={errors.gstNumber?.message}
          extraHint={
            watchedGst ? (
              isValidGst ? (
                <span style={{ fontSize: '0.625rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle2 size={10} /> Valid
                </span>
              ) : (
                <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>15 Chars</span>
              )
            ) : null
          }
        >
          <input
            type="text"
            placeholder="e.g. 27AAAAA1111A1Z1"
            style={{ 
              ...inputStyle(!!errors.gstNumber), 
              textTransform: 'uppercase', 
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
            }}
            {...register('gstNumber')}
          />
        </Field>

        <Field label="Email Address" icon={Mail} iconColor="#db2777" error={errors.email?.message}>
          <input
            type="text"
            placeholder="e.g. sales@vardhaman.com"
            {...regWithFocus('email', register('email'))}
          />
        </Field>

        {/* Row 4: Complete Address spanning full 2 columns */}
        <Field label="Business Address" icon={MapPin} iconColor="#64748b" error={errors.address?.message} span={2}>
          <textarea
            rows="1"
            {...register('address')}
            placeholder="Complete office/warehouse address..."
            style={textareaStyle}
            onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)'; e.target.style.background = '#ffffff'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(148,163,184,0.18)'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
          />
        </Field>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 8,
        paddingTop: 12, marginTop: 12,
        borderTop: '1px solid rgba(148,163,184,0.12)',
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '0 16px', height: 36, borderRadius: 8, cursor: 'pointer',
            background: '#f1f5f9', border: '1px solid rgba(148,163,184,0.2)',
            color: '#475569', fontSize: '0.8125rem', fontWeight: 600,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0 20px', height: 36, borderRadius: 8, cursor: 'pointer',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none', color: 'white',
            fontSize: '0.8125rem', fontWeight: 700,
            boxShadow: '0 3px 10px rgba(16,185,129,0.25)',
            display: 'flex', alignItems: 'center', gap: 6,
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 5px 14px rgba(16,185,129,0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(16,185,129,0.25)'; }}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {isEdit ? 'Save Changes' : 'Create Profile'}
        </button>
      </div>
    </form>
  );
}
