import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError('');
    setSubmitting(true);

    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="card p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Forgot Password</h1>
            <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                <p className="text-body">
                  If an account exists with that email, a password reset link has been sent.
                </p>
              </div>
              <Link to="/login">
                <Button variant="secondary" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {error && <p className="text-caption text-danger-500">{error}</p>}

              <Button type="submit" className="w-full" isLoading={submitting}>
                Send Reset Link
              </Button>

              <Link to="/login">
                <Button variant="secondary" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
