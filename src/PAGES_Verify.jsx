// OTP verification page
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PAGES_Verify() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const { verifyOTP, sendOTP } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '';

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0 && !canResend) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [resendTimer, canResend]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtp(value);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      await verifyOTP(phone, otp);
      toast.success('Verified! Setting up your profile...');
      navigate('/setup-profile');
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Invalid OTP. Please try again.');
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      await sendOTP(phone);
      toast.success('OTP sent again!');
      setResendTimer(30);
      setCanResend(false);
      setOtp('');
    } catch (err) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-white mb-8 hover:text-blue-100"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-block bg-white rounded-full p-4 mb-4">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Verify Your Number</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <p className="text-center text-gray-600">
            We sent a 6-digit code to <span className="font-semibold">{phone}</span>
          </p>

          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={handleChange}
              placeholder="000000"
              maxLength="6"
              className={`w-full px-4 py-3 border-2 rounded-lg font-bold text-3xl text-center tracking-widest focus:outline-none transition ${
                error
                  ? 'border-red-500 focus:border-red-600'
                  : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          {/* Resend */}
          <div className="text-center">
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50"
              >
                Resend OTP
              </button>
            ) : (
              <p className="text-gray-600 text-sm">
                Resend OTP in <span className="font-semibold">{resendTimer}s</span>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
