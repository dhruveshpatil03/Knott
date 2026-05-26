// Login page - phone number input
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PAGES_Login() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { sendOTP } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);
      const phoneWithCountry = `+91${phone}`;
      await sendOTP(phoneWithCountry);
      toast.success('OTP sent to your phone!');
      navigate('/verify', { state: { phone: phoneWithCountry } });
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <div className="inline-block bg-white rounded-full p-4 mb-4">
            <Phone size={48} className="text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Knott</h1>
          <p className="text-blue-100 text-lg">
            Buy & Sell Electronics Safely
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Welcome to Knott
          </h2>

          <p className="text-center text-gray-600">
            Enter your mobile number to get started
          </p>

          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Mobile Number
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-600 font-semibold">+91</span>
              <input
                type="text"
                value={phone}
                onChange={handleChange}
                placeholder="9876543210"
                maxLength="10"
                className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg font-semibold text-lg focus:outline-none transition ${
                  error
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
            </div>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || phone.length !== 10}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>

          {/* Info */}
          <p className="text-xs text-gray-600 text-center">
            We'll send you a 6-digit code via SMS to verify your number.
          </p>
        </form>

        {/* Footer */}
        <p className="text-center text-blue-100 text-xs mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
