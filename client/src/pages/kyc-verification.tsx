import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useNotification } from '@/components/ui/notification';
import { CheckCircle, Upload, FileText, Shield, Clock } from 'lucide-react';

export default function KYCVerification() {
  const [, setLocation] = useLocation();
  const { showNotification } = useNotification();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);

  // Get provider info from localStorage if available
  const providerInfo = JSON.parse(localStorage.getItem('pendingProvider') || '{}');

  const steps = [
    {
      id: 1,
      title: 'Business Information',
      description: 'Verify your business details',
      icon: FileText,
    },
    {
      id: 2,
      title: 'Document Upload',
      description: 'Upload required documents',
      icon: Upload,
    },
    {
      id: 3,
      title: 'Verification Review',
      description: 'Review and submit for approval',
      icon: Shield,
    },
  ];

  const requiredDocuments = [
    'Business License',
    'Tax ID Certificate',
    'Professional Certification',
    'Insurance Certificate',
    'Identity Verification',
  ];

  const handleDocumentUpload = (docType: string) => {
    // Simulate document upload
    if (!uploadedDocs.includes(docType)) {
      setUploadedDocs([...uploadedDocs, docType]);
      showNotification(`${docType} uploaded successfully`, 'success');
    }
  };

  const handleSubmitKYC = () => {
    showNotification(
      'KYC verification submitted successfully! We will review your application within 24-48 hours.',
      'success'
    );
    localStorage.removeItem('pendingProvider');
    setLocation('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            KYC Verification Process
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
                Business Information Verification
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-4">Your Business Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Name:</span>
                      <span className="font-medium">{providerInfo.businessName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Owner Name:</span>
                      <span className="font-medium">{providerInfo.ownerName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Category:</span>
                      <span className="font-medium">{providerInfo.serviceName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium">{providerInfo.experience || 'N/A'} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{providerInfo.location || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-4">Verification Requirements</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>• Business registration documents</li>
                      <li>• Valid tax identification</li>
                      <li>• Professional certifications</li>
                      <li>• Insurance coverage proof</li>
                      <li>• Identity verification</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue to Document Upload
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Document Upload
              </h2>
              
              <div className="space-y-4">
                {requiredDocuments.map((doc) => (
                  <div
                    key={doc}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center">
                      <FileText className="text-gray-400 mr-3" size={20} />
                      <span className="font-medium text-gray-700">{doc}</span>
                    </div>
                    
                    {uploadedDocs.includes(doc) ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle size={20} className="mr-2" />
                        <span className="text-sm font-medium">Uploaded</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDocumentUpload(doc)}
                        className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                      >
                        Upload
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-gray-600 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={uploadedDocs.length < requiredDocuments.length}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Review
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Verification Review
              </h2>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={24} />
                  <div>
                    <h3 className="text-lg font-medium text-green-800">
                      All Documents Uploaded
                    </h3>
                    <p className="text-green-700">
                      Your KYC verification is ready for submission
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="font-medium text-gray-700 mb-4">Business Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Business:</strong> {providerInfo.businessName}</p>
                    <p><strong>Service:</strong> {providerInfo.serviceName}</p>
                    <p><strong>Experience:</strong> {providerInfo.experience} years</p>
                    <p><strong>Rate:</strong> ${providerInfo.hourlyRate}/hour</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-4">Documents Uploaded</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {uploadedDocs.map((doc) => (
                      <div key={doc} className="flex items-center text-sm text-green-600 mb-1">
                        <CheckCircle size={16} className="mr-2" />
                        {doc}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <Clock className="text-yellow-500 mr-3" size={20} />
                  <div>
                    <h3 className="font-medium text-yellow-800">Review Process</h3>
                    <p className="text-sm text-yellow-700">
                      Our team will review your application within 24-48 hours. You'll receive an email notification once approved.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-gray-600 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitKYC}
                  className="bg-primary text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Submit for Review
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}