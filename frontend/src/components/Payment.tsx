import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'credit' | 'debit' | 'paypal' | 'bank';
  lastFour?: string;
  expiryDate?: string;
}

const Payment: React.FC = () => {
  const { t } = useTranslation();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', name: 'Visa ending in 1234', type: 'credit', lastFour: '1234', expiryDate: '12/25' },
    { id: '2', name: 'Mastercard ending in 5678', type: 'credit', lastFour: '5678', expiryDate: '06/26' },
  ]);
  const [selectedMethod, setSelectedMethod] = useState<string>('1');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form fields for new payment method
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const handleAddPaymentMethod = () => {
    if (cardNumber && expiryMonth && expiryYear && cvv && cardholderName) {
      const newMethod: PaymentMethod = {
        id: (paymentMethods.length + 1).toString(),
        name: `${cardholderName} ending in ${cardNumber.slice(-4)}`,
        type: 'credit',
        lastFour: cardNumber.slice(-4),
        expiryDate: `${expiryMonth}/${expiryYear.slice(-2)}`
      };
      
      setPaymentMethods([...paymentMethods, newMethod]);
      setSelectedMethod(newMethod.id);
      setIsAddingNew(false);
      
      // Reset form fields
      setCardNumber('');
      setExpiryMonth('');
      setExpiryYear('');
      setCvv('');
      setCardholderName('');
    }
  };

  const handleRemovePaymentMethod = (id: string) => {
    if (paymentMethods.length > 1) {
      setPaymentMethods(paymentMethods.filter(method => method.id !== id));
      if (selectedMethod === id) {
        setSelectedMethod(paymentMethods[0].id);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('paymentMethods')}</h2>
        
        <div className="space-y-4 mb-8">
          {paymentMethods.map((method) => (
            <div 
              key={method.id} 
              className={`border rounded-lg p-4 flex justify-between items-center ${
                selectedMethod === method.id 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  id={method.id}
                  name="paymentMethod"
                  checked={selectedMethod === method.id}
                  onChange={() => setSelectedMethod(method.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor={method.id} className="ml-3 block text-sm font-medium text-gray-700">
                  <span className="font-semibold">{method.name}</span>
                  {method.lastFour && (
                    <span className="block text-xs text-gray-500">
                      {t('endingIn')} {method.lastFour} • {method.expiryDate}
                    </span>
                  )}
                </label>
              </div>
              
              <button 
                onClick={() => handleRemovePaymentMethod(method.id)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        
        {!isAddingNew ? (
          <button 
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
          >
            {t('addNewPaymentMethod')}
          </button>
        ) : (
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('addPaymentMethod')}</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('cardholderName')}
                </label>
                <input
                  type="text"
                  id="cardholderName"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                  placeholder={t('enterCardholderName')}
                />
              </div>
              
              <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('cardNumber')}
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                  placeholder={t('enterCardNumber')}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiryMonth" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('expiryMonth')}
                  </label>
                  <input
                    type="text"
                    id="expiryMonth"
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value)}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                    placeholder="MM"
                  />
                </div>
                
                <div>
                  <label htmlFor="expiryYear" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('expiryYear')}
                  </label>
                  <input
                    type="text"
                    id="expiryYear"
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value)}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                    placeholder="YYYY"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('cvv')}
                </label>
                <input
                  type="text"
                  id="cvv"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                  placeholder="CVV"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAddPaymentMethod}
                  className="flex-grow px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                >
                  {t('savePaymentMethod')}
                </button>
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
