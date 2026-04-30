import { useState } from 'react';

export default function FeedbackForm({
  senderType   = 'customer',   // 'customer' | 'staff' | 'owner'
  senderName   = '',
  senderRole   = '',
  restaurantName = '',
  ownerName    = '',
  onSuccess    = () => {},
  compact      = false,        // true = smaller version for modals
}) {
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [message,   setMessage]   = useState('');
  const [submitting,setSubmitting]= useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !message.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating, message, senderType,
          senderName:    senderName    || 'Anonymous',
          senderRole:    senderRole    || '',
          restaurantName: restaurantName || '',
          ownerName:     ownerName     || ''
        })
      });
      setSubmitted(true);
      onSuccess();
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-4' : 'py-8'}`}>
        <span className="text-4xl mb-3">🙏</span>
        <p className="font-bold text-gray-800 dark:text-gray-100">Thank you for your feedback!</p>
        <p className="text-sm text-gray-400 mt-1">Your response helps us improve QRunch.</p>
      </div>
    );
  }

  const activeStars = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Star rating */}
      <div>
        <p className={`text-gray-600 dark:text-gray-400 mb-2 ${compact ? 'text-sm' : 'text-base font-medium'}`}>
          How was your experience?
        </p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(star => (
            <button key={star} type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-3xl transition-transform hover:scale-110 focus:outline-none">
              {star <= activeStars ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs mt-1 text-gray-400">
            {rating === 1 ? 'Very Poor' : rating === 2 ? 'Poor' : rating === 3 ? 'Okay' : rating === 4 ? 'Good' : 'Excellent!'}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label className={`text-gray-600 dark:text-gray-400 mb-1.5 block ${compact ? 'text-xs' : 'text-sm'}`}>
          Your feedback
        </label>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          rows={compact ? 3 : 4}
          placeholder="Tell us what you think — what went well, what could be better..."
          className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
      </div>

      <button type="submit" disabled={submitting || !rating || !message.trim()}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl text-sm transition">
        {submitting ? 'Submitting...' : '🚀 Submit Feedback'}
      </button>
    </form>
  );
}