import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useNotification } from '@/components/ui/notification';
import { CheckCircle, Upload, FileText, Shield, Clock, Phone, CreditCard, Eye, EyeOff } from 'lucide-react';

export default function EnhancedKYCVerification() {
  const [, setLocation] = useLocation();
  const { showNotification } = useNotification();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  
  // Form states
  const [aadharNumber, setAadharNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [otpData, setOtpData] = useState({
    phone: '',
    otp: '',
    sent: false,
    verified: false,
    loading: false
  });

  // Get provider info from localStorage if available
  const providerInfo = JSON.parse(localStorage.getItem('pendingProvider') || '{}');

  const steps = [
    {
      id: 1,
      title: 'Phone Verification',
      description: 'Verify your registered phone number',
      icon: Phone,
    },
    {
      id: 2,
      title: 'Identity Documents',
      description: 'Provide Aadhar and PAN details',
      icon: CreditCard,
    },
    {
      id: 3,
      title: 'Document Upload',
      description: 'Upload required documents',
      icon: Upload,
    },
    {
      id: 4,
      title: 'Verification Review',
      description: 'Review and submit for approval',
      icon: Shield,
    },
  ];

  const requiredDocuments = [
    {
      name: 'Aadhar Card',
      description: 'Government-issued Aadhar card (front and back)',
      required: true,
      formats: ['JPG', 'PNG', 'PDF'],
      maxSize: '2MB'
    },
    {
      name: 'PAN Card',
      description: 'Permanent Account Number card',
      required: true,
      formats: ['JPG', 'PNG', 'PDF'],
      maxSize: '2MB'
    },
    {
      name: 'Business Registration Certificate',
      description: 'GST registration or Shop Act license',
      required: true,
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    },
    {
      name: 'Professional Certification',
      description: 'Trade license or professional certificates',
      required: true,
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    },
    {
      name: 'Insurance Certificate',
      description: 'Public liability or professional indemnity insurance',
      required: true,
      formats: ['PDF', 'JPG', 'PNG'],
      maxSize: '5MB'
    },
    {
      name: 'Bank Statement',
      description: 'Last 3 months bank statement or cancelled cheque',
      required: true,
      formats: ['PDF'],
      maxSize: '10MB'
    }
  ];

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send OTP');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setOtpData(prev => ({ ...prev, sent: true, loading: false }));
      showNotification('OTP sent successfully to your registered phone number', 'success');
      
      // Show OTP in development mode
      if (data.debug_otp) {
        showNotification(`Development OTP: ${data.debug_otp}`, 'info');
      }
    },
    onError: (error: any) => {
      setOtpData(prev => ({ ...prev, loading: false }));
      showNotification(error.message || 'Failed to send OTP', 'error');
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { phone: string; otp: string }) => {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify OTP');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setOtpData(prev => ({ ...prev, verified: true, loading: false }));
      showNotification('Phone number verified successfully!', 'success');
    },
    onError: (error: any) => {
      setOtpData(prev => ({ ...prev, loading: false }));
      showNotification(error.message || 'Failed to verify OTP', 'error');
    },
  });

  const handleSendOtp = () => {
    const phone = providerInfo.phone || otpData.phone;
    if (!phone) {
      showNotification('Phone number is required', 'error');
      return;
    }
    
    setOtpData(prev => ({ ...prev, phone, loading: true }));
    sendOtpMutation.mutate(phone);
  };

  const handleVerifyOtp = () => {
    if (!otpData.otp) {
      showNotification('Please enter the OTP', 'error');
      return;
    }
    
    setOtpData(prev => ({ ...prev, loading: true }));
    verifyOtpMutation.mutate({ 
      phone: providerInfo.phone || otpData.phone, 
      otp: otpData.otp 
    });
  };

  const handleDocumentUpload = (docName: string, file: File) => {
    // Validate file type and size
    const doc = requiredDocuments.find(d => d.name === docName);
    if (!doc) return;
    
    const fileExtension = file.name.split('.').pop()?.toUpperCase();
    if (!doc.formats.includes(fileExtension || '')) {
      showNotification(`Invalid file format. Please upload ${doc.formats.join(', ')} files only.`, 'error');
      return;
    }
    
    const maxSizeBytes = parseInt(doc.maxSize) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showNotification(`File too large. Maximum size allowed is ${doc.maxSize}.`, 'error');
      return;
    }
    
    // In a real app, upload to server/cloud storage here
    // For now, we'll simulate successful upload
    if (!uploadedDocs.includes(docName)) {
      setUploadedDocs([...uploadedDocs, docName]);
      showNotification(`${docName} uploaded successfully (${file.name})`, 'success');
    } else {
      showNotification(`${docName} replaced successfully (${file.name})`, 'success');
    }
  };
  
  const handleFileSelect = (docName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleDocumentUpload(docName, file);
    }
  };

  const submitKYCMutation = useMutation({
    mutationFn: async () => {
      if (!providerInfo.id) throw new Error('Provider information not found');
      
      // Update the provider's KYC documents with all verification data
      const kycDocuments = {
        submitted_at: new Date().toISOString(),
        uploaded_documents: uploadedDocs,
        aadhar_number: aadharNumber,
        pan_number: panNumber,
        phone_verified: otpData.verified,
        status: 'pending_review'
      };

      const response = await fetch(`/api/admin/providers/${providerInfo.id}/kyc`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          kycDocuments,
          aadharNumber,
          panNumber,
          phoneVerified: otpData.verified,
          otpVerified: otpData.verified,
          status: 'Pending KYC Review'
        }),
      });

      if (!response.ok) throw new Error('Failed to submit KYC verification');
      return response.json();
    },
    onSuccess: () => {
      showNotification(
        'KYC verification submitted successfully! Admin will review your application within 24-48 hours.',
        'success'
      );
      localStorage.removeItem('pendingProvider');
      setLocation('/auth');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to submit KYC verification', 'error');
    },
  });

  const handleSubmitKYC = () => {
    if (!otpData.verified) {
      showNotification('Please verify your phone number first', 'error');
      return;
    }
    
    if (!aadharNumber || !panNumber) {
      showNotification('Please provide both Aadhar and PAN numbers', 'error');
      return;
    }
    
    if (uploadedDocs.length < requiredDocuments.length) {
      showNotification('Please upload all required documents', 'error');
      return;
    }
    
    submitKYCMutation.mutate();
  };

  const isAadharValid = /^\d{12}$/.test(aadharNumber);
  const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Enhanced KYC Verification Process
          </h1>
          <p className="text-lg text-gray-600">
            Complete your verification to start offering services on ServiceHub
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    currentStep >= step.id
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-400 border-gray-300'
                  }`}
                >
                  <step.icon size={20} />
                </div>
                <div className="ml-4 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-primary' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content based on current step */}
        <div className="bg-white rounded-lg shadow p-6">
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Phone Number Verification
              </h2>
              
              <div className="max-w-md">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registered Phone Number
                  </label>
                  <input
                    type="text"
                    value={providerInfo.phone || otpData.phone}
                    onChange={(e) => setOtpData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={!!providerInfo.phone}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {providerInfo.phone ? 'Using registered phone number' : 'Enter your phone number'}
                  </p>
                </div>

                {!otpData.sent ? (
                  <button
                    onClick={handleSendOtp}
                    disabled={otpData.loading}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {otpData.loading ? 'Sending...' : 'Send OTP'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        value={otpData.otp}
                        onChange={(e) => setOtpData(prev => ({ ...prev, otp: e.target.value }))}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={handleVerifyOtp}
                        disabled={otpData.loading || !otpData.otp}
                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {otpData.loading ? 'Verifying...' : 'Verify OTP'}
                      </button>
                      
                      <button
                        onClick={handleSendOtp}
                        disabled={otpData.loading}
                        className="text-primary px-4 py-2 rounded-lg border border-primary hover:bg-primary hover:text-white transition-colors"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )}

                {otpData.verified && (
                  <div className="mt-4 flex items-center text-green-600">
                    <CheckCircle size={20} className="mr-2" />
                    <span>Phone number verified successfully!</span>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!otpData.verified}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Identity Documents
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Identity Document Details
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhar Card Number *
                  </label>
                  <input
                    type="text"
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="123412341234"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      aadharNumber && !isAadharValid ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {aadharNumber && !isAadharValid && (
                    <p className="text-red-500 text-sm mt-1">Aadhar number must be 12 digits</p>
                  )}
                  {isAadharValid && (
                    <div className="flex items-center text-green-600 mt-1">
                      <CheckCircle size={16} className="mr-1" />
                      <span className="text-sm">Valid Aadhar number</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Card Number *
                  </label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="ABCDE1234F"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      panNumber && !isPanValid ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {panNumber && !isPanValid && (
                    <p className="text-red-500 text-sm mt-1">PAN number format: ABCDE1234F</p>
                  )}
                  {isPanValid && (
                    <div className="flex items-center text-green-600 mt-1">
                      <CheckCircle size={16} className="mr-1" />
                      <span className="text-sm">Valid PAN number</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Important Information</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Ensure the details match exactly with your documents</li>
                  <li>• These details will be used for identity verification</li>
                  <li>• Any mismatch may lead to rejection of your application</li>
                  <li>• You'll need to upload the physical documents in the next step</li>
                </ul>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-primary px-6 py-2 rounded-lg border border-primary hover:bg-primary hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!isAadharValid || !isPanValid}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Document Upload
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Document Upload
              </h2>
              
              <div className="space-y-4">
                {requiredDocuments.map((doc) => (
                  <div
                    key={doc.name}
                    className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start flex-1">
                      <FileText className="text-gray-400 mr-3 mt-1" size={20} />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700">{doc.name}</span>
                          {doc.required && (
                            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">Required</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                        <div className="text-xs text-gray-400 mt-1">
                          Formats: {doc.formats.join(', ')} | Max size: {doc.maxSize}
                        </div>
                      </div>
                    </div>
                    
                    {uploadedDocs.includes(doc.name) ? (
                      <div className="flex flex-col items-end ml-4">
                        <div className="flex items-center text-green-600 mb-2">
                          <CheckCircle size={20} className="mr-2" />
                          <span className="text-sm font-medium">Uploaded</span>
                        </div>
                        <label className="cursor-pointer text-blue-600 text-xs hover:underline">
                          Replace file
                          <input
                            type="file"
                            className="hidden"
                            accept={doc.formats.map(f => `.${f.toLowerCase()}`).join(',')}
                            onChange={(e) => handleFileSelect(doc.name, e)}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="ml-4">
                        <label className="cursor-pointer bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors inline-block">
                          Choose File
                          <input
                            type="file"
                            className="hidden"
                            accept={doc.formats.map(f => `.${f.toLowerCase()}`).join(',')}
                            onChange={(e) => handleFileSelect(doc.name, e)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-primary px-6 py-2 rounded-lg border border-primary hover:bg-primary hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={uploadedDocs.length < requiredDocuments.length}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Review
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Verification Review
              </h2>
              
              <div className="space-y-6">
                {/* Phone Verification Status */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Phone Verification</h3>
                      <p className="text-sm text-gray-500">{providerInfo.phone}</p>
                    </div>
                    {otpData.verified ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle size={20} className="mr-2" />
                        <span className="text-sm">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <Clock size={20} className="mr-2" />
                        <span className="text-sm">Not Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity Documents */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Identity Documents</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Aadhar Number:</p>
                      <p className="font-medium">{aadharNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">PAN Number:</p>
                      <p className="font-medium">{panNumber || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Uploaded Documents</h3>
                  <div className="grid md:grid-cols-2 gap-2">
                    {requiredDocuments.map((doc) => (
                      <div key={doc.name} className="flex items-center">
                        {uploadedDocs.includes(doc.name) ? (
                          <CheckCircle size={16} className="text-green-600 mr-2" />
                        ) : (
                          <Clock size={16} className="text-red-600 mr-2" />
                        )}
                        <span className="text-sm">{doc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Important Notice</h4>
                <p className="text-sm text-yellow-700">
                  By submitting this KYC verification, you confirm that all provided information is accurate and authentic. 
                  Our admin team will review your application within 24-48 hours. You'll receive an email notification 
                  once your verification is complete.
                </p>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-primary px-6 py-2 rounded-lg border border-primary hover:bg-primary hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitKYC}
                  disabled={submitKYCMutation.isPending || !otpData.verified || !isAadharValid || !isPanValid || uploadedDocs.length < requiredDocuments.length}
                  className="bg-primary text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitKYCMutation.isPending ? 'Submitting...' : 'Submit KYC Verification'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}