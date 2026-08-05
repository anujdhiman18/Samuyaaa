/**
 * Razorpay Payment Gateway Service (Test Mode Integration)
 */

// Load Razorpay Checkout SDK dynamically
export const loadRazorpaySDK = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Open Razorpay Payment Gateway Checkout Modal (Test Mode)
 */
export const openRazorpayCheckout = async ({
  amount,
  description = 'Monthly Tuition Fee Payment',
  student = {},
  monthYear = 'July 2026',
  onSuccess,
  onError,
  onDismiss,
}) => {
  const isLoaded = await loadRazorpaySDK();
  if (!isLoaded) {
    if (onError) onError(new Error('Razorpay SDK failed to load. Please check internet connection.'));
    return;
  }

  // Razorpay Test Mode Key ID (Defaults to Test Key ID)
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SaumyaaStudies2026';

  const amountInPaise = Math.round(Number(amount || 2500) * 100);

  const options = {
    key: razorpayKey,
    amount: amountInPaise,
    currency: 'INR',
    name: 'Saumyaa Studies',
    description: description,
    image: '/logo.jpg',
    handler: function (response) {
      if (onSuccess) {
        onSuccess({
          razorpay_payment_id: response.razorpay_payment_id || `pay_test_${Date.now()}`,
          razorpay_order_id: response.razorpay_order_id || `order_test_${Date.now()}`,
          razorpay_signature: response.razorpay_signature || 'mock_sig_razorpay_test',
          amountPaid: Number(amount),
          monthYear,
          paymentMode: 'Razorpay (Online)',
        });
      }
    },
    prefill: {
      name: student.fullName || student.name || 'Student',
      email: student.email || 'student@saumyaa.edu.in',
      contact: student.phone || student.parentPhone || '9816000000',
    },
    notes: {
      student_id: student._id || student.id || 'student',
      student_name: student.fullName || student.name || 'Student',
      roll_number: student.rollNumber || 'N/A',
      month_year: monthYear,
      payment_type: 'Tuition Fee',
      mode: 'Test Mode',
    },
    theme: {
      color: '#A03000',
      backdrop_color: 'rgba(0,0,0,0.6)',
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) onDismiss();
      },
    },
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      if (onError) {
        onError(response.error || new Error('Payment failed or cancelled by user.'));
      }
    });
    rzp.open();
  } catch (err) {
    if (onError) onError(err);
  }
};
