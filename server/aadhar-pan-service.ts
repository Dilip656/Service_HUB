// Government Identity Verification Service
// In production, this would integrate with official government APIs

interface AadharVerificationResponse {
  isValid: boolean;
  registeredPhone?: string;
  holderName?: string;
  error?: string;
}

interface PanVerificationResponse {
  isValid: boolean;
  registeredPhone?: string;
  holderName?: string;
  error?: string;
}

export class IdentityVerificationService {
  // Simulated Aadhar database for demonstration
  // In production, this would call the official UIDAI API
  private static aadharDatabase = new Map<string, { phone: string; name: string }>([
    ['123456789012', { phone: '+91 9876543210', name: 'Dilip Vaishnav' }],
    ['234567890123', { phone: '+91 9644023612', name: 'Ravi Mourya' }],
    ['345678901234', { phone: '+91 8765432109', name: 'Priya Sharma' }],
    ['456789012345', { phone: '+91 7654321098', name: 'Amit Kumar' }],
    ['567890123456', { phone: '+91 6543210987', name: 'Sunita Devi' }],
    ['490448561130', { phone: '+91 9123456789', name: 'Amit Kumar' }],
    ['123412341234', { phone: '+91 9644023612', name: 'Suthar' }]
  ]);

  // Simulated PAN database for demonstration
  // In production, this would call the official Income Tax Department API
  private static panDatabase = new Map<string, { phone: string; name: string }>([
    ['ABCDE1234F', { phone: '+91 9876543210', name: 'Dilip Vaishnav' }],
    ['FGHIJ5678K', { phone: '+91 9644023612', name: 'Ravi Mourya' }],
    ['KLMNO9012P', { phone: '+91 8765432109', name: 'Priya Sharma' }],
    ['PQRST3456U', { phone: '+91 7654321098', name: 'Amit Kumar' }],
    ['UVWXY7890Z', { phone: '+91 6543210987', name: 'Sunita Devi' }],
    ['GOWPR7458D', { phone: '+91 9123456789', name: 'Amit Kumar' }],
    ['ABCDE1234F', { phone: '+91 9644023612', name: 'Suthar' }]
  ]);

  static async verifyAadhar(aadharNumber: string, ownerName?: string): Promise<AadharVerificationResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate format
    if (!/^\d{12}$/.test(aadharNumber)) {
      return {
        isValid: false,
        error: 'Invalid Aadhar number format. Aadhar must be 12 digits'
      };
    }

    // Check in simulated database first
    let record = this.aadharDatabase.get(aadharNumber);
    
    if (!record) {
      // Generate dynamic test data for any valid Aadhar number
      // Use the last 4 digits to generate consistent but different phone numbers
      const lastFour = aadharNumber.slice(-4);
      const phoneNumber = `+91 9${lastFour}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      // Use the provided owner name if available, otherwise generate a consistent name
      const holderName = ownerName || (() => {
        const names = ['Amit Kumar', 'Priya Sharma', 'Rajesh Singh', 'Sunita Devi', 'Vikash Yadav', 'Pooja Gupta'];
        const nameIndex = parseInt(aadharNumber.slice(0, 1)) % names.length;
        return names[nameIndex];
      })();
      
      record = { phone: phoneNumber, name: holderName };
      
      // Store the generated record for consistency in future calls
      this.aadharDatabase.set(aadharNumber, record);
    }

    return {
      isValid: true,
      registeredPhone: record.phone,
      holderName: record.name
    };
  }

  static async verifyPan(panNumber: string, ownerName?: string): Promise<PanVerificationResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate format
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      return {
        isValid: false,
        error: 'Invalid PAN number format. Format should be: ABCDE1234F'
      };
    }

    // Check in simulated database first
    let record = this.panDatabase.get(panNumber);
    
    if (!record) {
      // Generate dynamic test data for any valid PAN number
      // Use the numeric part to generate consistent phone numbers
      const numericPart = panNumber.slice(5, 9);
      const phoneNumber = `+91 9${numericPart}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
      
      // Use the provided owner name if available, otherwise generate a consistent name
      const holderName = ownerName || (() => {
        const names = ['Amit Kumar', 'Priya Sharma', 'Rajesh Singh', 'Sunita Devi', 'Vikash Yadav', 'Pooja Gupta'];
        const nameIndex = panNumber.charCodeAt(0) % names.length;
        return names[nameIndex];
      })();
      
      record = { phone: phoneNumber, name: holderName };
      
      // Store the generated record for consistency in future calls
      this.panDatabase.set(panNumber, record);
    }

    return {
      isValid: true,
      registeredPhone: record.phone,
      holderName: record.name
    };
  }

  // Verify if the provided name matches the records
  static async crossVerifyIdentity(
    aadharNumber: string, 
    panNumber: string, 
    providedName: string
  ): Promise<{
    isMatched: boolean;
    aadharPhone?: string;
    panPhone?: string;
    verifiedPhone?: string;
    error?: string;
  }> {
    try {
      const [aadharResult, panResult] = await Promise.all([
        this.verifyAadhar(aadharNumber, providedName),
        this.verifyPan(panNumber, providedName)
      ]);

      if (!aadharResult.isValid) {
        return { isMatched: false, error: aadharResult.error };
      }

      if (!panResult.isValid) {
        return { isMatched: false, error: panResult.error };
      }

      // Check if both documents have same phone number
      if (aadharResult.registeredPhone !== panResult.registeredPhone) {
        return {
          isMatched: false,
          aadharPhone: aadharResult.registeredPhone,
          panPhone: panResult.registeredPhone,
          error: 'Phone numbers in Aadhar and PAN records do not match'
        };
      }

      // Check if names match (basic name matching)
      const normalizedAadharName = aadharResult.holderName?.toLowerCase().replace(/\s+/g, ' ').trim();
      const normalizedPanName = panResult.holderName?.toLowerCase().replace(/\s+/g, ' ').trim();
      const normalizedProvidedName = providedName.toLowerCase().replace(/\s+/g, ' ').trim();

      const nameMatches = normalizedAadharName === normalizedProvidedName || 
                         normalizedPanName === normalizedProvidedName ||
                         normalizedAadharName === normalizedPanName;

      if (!nameMatches) {
        return {
          isMatched: false,
          error: `Name mismatch: Provided "${providedName}", Aadhar "${aadharResult.holderName}", PAN "${panResult.holderName}"`
        };
      }

      return {
        isMatched: true,
        verifiedPhone: aadharResult.registeredPhone,
        aadharPhone: aadharResult.registeredPhone,
        panPhone: panResult.registeredPhone
      };

    } catch (error) {
      return {
        isMatched: false,
        error: `Verification failed: ${(error as Error).message}`
      };
    }
  }
}