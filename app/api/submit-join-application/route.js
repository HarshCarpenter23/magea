// app/api/submit-join-application/route.js
import { executeQuery } from '../../../lib/db';

// Helper to convert undefined to null for database
const toNull = (value) => (value === undefined || value === '' ? null : value);

export async function POST(request) {
  try {
    // Parse JSON body (files are now uploaded directly to Vercel Blob from client)
    const body = await request.json();

    // Extract form fields and file URLs (convert undefined to null)
    const applicationData = {
      // Personal Details
      idNumber: toNull(body.idNumber),
      fullName: toNull(body.fullName),
      dob: toNull(body.dob),
      aadhaar: toNull(body.aadhaar),
      mobile1: toNull(body.mobile1),
      mobile2: toNull(body.mobile2),
      pan: toNull(body.pan),
      email: toNull(body.email),

      // Bank Details
      bankName: toNull(body.bankName),
      branch: toNull(body.branch),
      ifsc: toNull(body.ifsc),
      accountType: toNull(body.accountType),
      accountNumber: toNull(body.accountNumber),

      // Shop Details
      shopName: toNull(body.shopName),
      shopDoor: toNull(body.shopDoor),
      shopStreet: toNull(body.shopStreet),
      shopArea: toNull(body.shopArea),
      shopLocation: toNull(body.shopLocation),
      shopPin: toNull(body.shopPin),

      // House Details
      fatherName: toNull(body.fatherName),
      maritalStatus: toNull(body.maritalStatus),
      spouseName: toNull(body.spouseName),
      spouseMobile: toNull(body.spouseMobile),
      houseDoor: toNull(body.houseDoor),
      houseStreet: toNull(body.houseStreet),
      houseArea: toNull(body.houseArea),
      houseLocation: toNull(body.houseLocation),
      housePin: toNull(body.housePin),

      // Additional Details
      techniciansCount: toNull(body.techniciansCount),
      appliances: toNull(body.appliances),

      // Qualifications
      academicQualification: toNull(body.academicQualification),
      technicalQualification: toNull(body.technicalQualification),

      // Emergency & Other Details
      bloodGroup: toNull(body.bloodGroup),
      oldId: toNull(body.oldId),
      emergencyContact: toNull(body.emergencyContact),
      emergencyRelation: toNull(body.emergencyRelation),
      experience: toNull(body.experience),
    };

    // File URLs from client-side upload
    const fileUrls = body.fileUrls || {};

    // Validate required fields
    const requiredFields = [
      'idNumber', 'fullName', 'dob', 'aadhaar', 'mobile1', 'pan', 'email',
      'bankName', 'branch', 'ifsc', 'accountType', 'accountNumber',
      'shopName', 'shopDoor', 'shopStreet', 'shopArea', 'shopLocation', 'shopPin',
      'fatherName', 'maritalStatus', 'houseDoor', 'houseStreet', 'houseArea', 'houseLocation', 'housePin',
      'techniciansCount', 'appliances', 'academicQualification', 'technicalQualification',
      'bloodGroup', 'emergencyContact', 'emergencyRelation', 'experience'
    ];

    const missingFields = requiredFields.filter(field => !applicationData[field]);
    if (missingFields.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate worker code
    const workerCode = `MAEGA${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Parse name into first and last name
    const nameParts = (applicationData.fullName || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Prepare shop address
    const shopAddress = `${applicationData.shopDoor || ''}, ${applicationData.shopStreet || ''}, ${applicationData.shopArea || ''}, ${applicationData.shopLocation || ''} - ${applicationData.shopPin || ''}`;

    // Prepare house address
    const houseAddress = `${applicationData.houseDoor || ''}, ${applicationData.houseStreet || ''}, ${applicationData.houseArea || ''}, ${applicationData.houseLocation || ''} - ${applicationData.housePin || ''}`;

    // Insert worker data into database
    const insertQuery = `
      INSERT INTO workers (
        worker_code, first_name, last_name, phone, email, date_of_birth,
        photo_url, address_line1, address_line2, city, state, pincode,
        account_holder_name, account_number, account_type, bank_name, ifsc_code, branch_name,
        shop_name, shop_address, shop_phone,
        house_address, marital_status,
        academic_qualification, technical_qualification, other_qualifications,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        blood_group, id_proof_url, certificates_url,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      workerCode,
      firstName,
      lastName,
      applicationData.mobile1,
      applicationData.email,
      applicationData.dob,
      fileUrls.photo || null, // From client-side upload
      houseAddress,
      null, // address_line2
      applicationData.houseArea, // city
      null, // state - extract from houseLocation if needed
      applicationData.housePin,
      applicationData.fullName, // account_holder_name
      applicationData.accountNumber,
      applicationData.accountType,
      applicationData.bankName,
      applicationData.ifsc,
      applicationData.branch,
      applicationData.shopName,
      shopAddress,
      applicationData.mobile2,
      houseAddress,
      applicationData.maritalStatus,
      applicationData.academicQualification,
      applicationData.technicalQualification,
      `Appliances: ${applicationData.appliances || 'N/A'}\nTechnicians Available: ${applicationData.techniciansCount || 'N/A'}\nExperience: ${applicationData.experience || 'N/A'}\nFather: ${applicationData.fatherName || 'N/A'}\nSpouse: ${applicationData.spouseName || 'N/A'}\nSpouse Phone: ${applicationData.spouseMobile || 'N/A'}\nOld ID: ${applicationData.oldId || 'N/A'}\nAadhaar: ${applicationData.aadhaar || 'N/A'}\nPAN: ${applicationData.pan || 'N/A'}`,
      applicationData.emergencyRelation,
      applicationData.emergencyContact,
      applicationData.emergencyRelation,
      applicationData.bloodGroup || null,
      fileUrls.idProof || null,
      fileUrls.certificates || null,
      'Pending Approval',
      new Date(),
      new Date()
    ];

    const result = await executeQuery(insertQuery, values);

    // If successful, also create entries in worker_services table for appliances
    if (result.insertId && applicationData.appliances) {
      const appliances = applicationData.appliances.split(',').map(a => a.trim());
      const applianceServiceMap = {
        'AC': 1,
        'Refrigerator': 2,
        'WC (Water Cooler)': 7,
        'BC (Bottle Cooler)': 7,
        'WD (Water Dispenser)': 7,
        'DF (Deep Freezer)': 8,
        'Package AC': 1,
        'Cold rooms': 8,
        'FOW': 2
      };

      for (const appliance of appliances) {
        const serviceId = applianceServiceMap[appliance];
        if (serviceId) {
          await executeQuery(
            'INSERT INTO worker_services (worker_id, service_id, skill_level, is_active, created_at) VALUES (?, ?, ?, ?, ?)',
            [result.insertId, serviceId, 'Intermediate', 1, new Date()]
          );
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Application submitted successfully',
      workerCode: workerCode,
      workerId: result.insertId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error submitting application:', error);

    // Handle specific database errors
    let errorMessage = 'Failed to submit application. Please try again.';

    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      if (error.message?.includes('phone')) {
        errorMessage = 'This phone number is already registered. Please use a different number.';
      } else if (error.message?.includes('email')) {
        errorMessage = 'This email is already registered. Please use a different email.';
      } else {
        errorMessage = 'An account with these details already exists.';
      }
    } else if (error.code === 'WARN_DATA_TRUNCATED' || error.errno === 1265) {
      errorMessage = 'Invalid data format. Please check all fields and try again.';
    }

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
