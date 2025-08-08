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
      
      // Update the provider's KYC documents with uploaded document info
      const kycDocuments = {
        submitted_at: new Date().toISOString(),
        uploaded_documents: uploadedDocs,
        status: 'pending_review'
      };

      const response = await fetch(`/api/admin/providers/${providerInfo.id}/kyc`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          kycDocuments,
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
    submitKYCMutation.mutate();
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
                  onClick={() => setCurrentStep(1)}
                  className="text-gray-600 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={uploadedDocs.length < requiredDocuments.filter(doc => doc.required).length}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Review ({uploadedDocs.length}/{requiredDocuments.filter(doc => doc.required).length})
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
                      All Required Documents Uploaded
                    </h3>
                    <p className="text-green-700">
                      Your KYC verification with authentic Indian documents is ready for admin review. Our team will verify your Aadhar, PAN, and business documents within 24-48 hours.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-800 mb-2">Document Verification Process</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Aadhar and PAN verification through government databases</li>
                  <li>• Business registration cross-check with official records</li>
                  <li>• Professional certification validation</li>
                  <li>• Insurance policy authenticity verification</li>
                  <li>• Bank account verification for payments</li>
                </ul>
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
                  <h3 className="font-medium text-gray-700 mb-4">Documents Verified ({uploadedDocs.length})</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {uploadedDocs.map((doc) => (
                      <div key={doc} className="flex items-center text-sm text-green-600 mb-1">
                        <CheckCircle size={16} className="mr-2" />
                        {doc}
                      </div>
                    ))}
                    {uploadedDocs.length === 0 && (
                      <p className="text-gray-500 text-sm">No documents uploaded yet</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <Clock className="text-yellow-500 mr-3" size={20} />
                  <div>
                    <h3 className="font-medium text-yellow-800">Next Steps</h3>
                    <p className="text-sm text-yellow-700">
                      Once submitted, your documents will undergo thorough verification including Aadhar/PAN validation. You'll receive email updates at each step and be notified when approved to start offering services.
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