import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { customerApi } from '../../api/customer.api';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(20).optional().nullable().or(z.literal('')),
  email: z.string().email('Invalid email address').or(z.literal('')).optional().nullable(),
  address: z.string().max(500).optional().nullable().or(z.literal('')),
});

export function CustomerForm({ isOpen, onClose, onSuccess, customer = null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
      });
    } else {
      reset({
        name: '',
        phone: '',
        email: '',
        address: '',
      });
    }
  }, [customer, reset, isOpen]);

  const onSubmit = async (data) => {
    setError(null);
    setLoading(true);
    try {
      // Clean empty strings to null
      const payload = {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
      };

      if (customer) {
        await customerApi.updateCustomer(customer.id, payload);
      } else {
        await customerApi.createCustomer(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Edit Customer' : 'Add New Customer'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-slate-300">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="input-group">
          <label className="input-label">Customer Name *</label>
          <input
            type="text"
            {...register('name')}
            className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder="e.g. Amit Sharma"
          />
          {errors.name && <p className="text-xs text-red-450 mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="input-group">
            <label className="input-label">Phone Number</label>
            <input
              type="text"
              {...register('phone')}
              className={`input ${errors.phone ? 'input-error' : ''}`}
              placeholder="e.g. 9876543210"
            />
            {errors.phone && <p className="text-xs text-red-455 mt-1">{errors.phone.message}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="text"
              {...register('email')}
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="e.g. amit@gmail.com"
            />
            {errors.email && <p className="text-xs text-red-455 mt-1">{errors.email.message}</p>}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Address</label>
          <textarea
            rows="2"
            {...register('address')}
            className={`input ${errors.address ? 'input-error' : ''}`}
            style={{ height: 'auto', padding: '10px 12px' }}
            placeholder="Street address, city, etc."
          />
          {errors.address && <p className="text-xs text-red-455 mt-1">{errors.address.message}</p>}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary font-semibold"
          >
            {loading && <RefreshCw className="animate-spin h-4 w-4 mr-2" />}
            {customer ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default CustomerForm;
