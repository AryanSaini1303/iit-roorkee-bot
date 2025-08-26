'use client';

import { useEffect, useState } from 'react';
import styles from './OnboardingModal.module.css';
import { createClient } from '@/utils/supabase/client';

export default function OnboardingModal({ session, func }) {
  const { phone, organisation, designation } =
    session?.user.user_metadata || {};
  //   console.log(phone, organisation);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    phone: phone || '',
    organisation: organisation || '',
    designation: designation || '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session && (!phone || !organisation || !designation)) {
      setShowModal(true);
    }
  }, [session, phone, organisation, designation]);
  //   console.log(showModal);

  async function updateUserProfile(data) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data });
    if (error) {
      console.error('Error updating user metadata:', error.message);
    } else {
      setShowModal(false); // close modal after success
      func(true);
    }
    setLoading(false);
  }

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await updateUserProfile(formData);
  }

  if (!showModal) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Complete Your Profile</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Phone Number
            <input
              type="number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Organisation
            <input
              type="text"
              name="organisation"
              value={formData.organisation}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Designation
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              required
            />
          </label>
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
