// src/pages/expenses/CategoriesModal.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '../../api/expense.api';
import { Loader2, Plus, Check } from 'lucide-react';
import { inputBase, errorBannerStyle } from '../../components/common/FormField';

const PRESETS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#64748b',
];

export default function CategoriesModal({ onClose }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [error, setError] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expenseApi.getCategories().then((r) => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: (newCat) => expenseApi.createCategory(newCat),
    onSuccess: () => { setName(''); queryClient.invalidateQueries(['expense-categories']); },
    onError: (err) => { setError(err.response?.data?.message || 'Failed to create category.'); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    mutation.mutate({ name: name.trim(), color });
  };

  return (
    <div>
      {/* Add form */}
      <form onSubmit={handleSubmit} style={{ paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Add Custom Category
        </p>
        {error && <div style={errorBannerStyle}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
              Category Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Electricity, Marketing"
              maxLength={30}
              style={inputBase}
              onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(148,163,184,0.2)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <button
            type="submit"
            disabled={mutation.isPending || !name.trim()}
            style={{
              height: 38, padding: '0 16px', borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', color: 'white',
              fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              opacity: (mutation.isPending || !name.trim()) ? 0.55 : 1,
              boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
              fontFamily: 'inherit',
            }}
          >
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add
          </button>
        </div>

        {/* Color Palette */}
        <div>
          <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
            Category Color
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setColor(p)}
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  backgroundColor: p, border: color === p ? '2.5px solid #0f172a' : '2px solid transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  outline: color === p ? '2px solid ' + p : 'none',
                  outlineOffset: 2,
                  transition: 'transform 0.12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {color === p && <Check size={12} color="white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Categories List */}
      <div>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Existing Categories
        </p>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Loader2 size={22} className="animate-spin" color="#10b981" />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {categories.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 10,
                  border: '1.5px solid rgba(148,163,184,0.12)',
                  background: '#f8fafc',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, backgroundColor: c.color || '#64748b' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </span>
                {c.isDefault && (
                  <span style={{ fontSize: '0.625rem', background: '#e2e8f0', color: '#64748b', padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', fontWeight: 600, flexShrink: 0 }}>
                    Core
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
