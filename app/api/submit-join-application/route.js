// app/api/submit-join-application/route.js
import { executeQuery } from '../../../lib/db';

export async function POST(request) {
  try {
    // Parse JSON body (files are now uploaded directly to Vercel Blob from client)
    const body = await request.json();

    // Extract form fields and file URLs
    const applicationData = {
      // Personal Details
      idNumber: body.idNumber,
      fullName: body.fullName,
      dob: body.dob,
      aadhaar: body.aadhaar,
      mobile1: body.mobile1,
      mobile2: body.mobile2,
      pan: body.pan,
      email: body.email,

      // Bank Details
      bankName: body.bankName,
      branch: body.branch,
      ifsc: body.ifsc,
      accountType: body.accountType,
      accountNumber: body.accountNumber,

      // Shop Details
      shopName: body.shopName,
      shopDoor: body.shopDoor,
      shopStreet: body.shopStreet,
      shopArea: body.shopArea,
      shopLocation: body.shopLocation,
      shopPin: body.shopPin,

      // House Details
      fatherName: body.fatherName,
      maritalStatus: body.maritalStatus,
      spouseName: body.spouseName,
      spouseMobile: body.spouseMobile,
      houseDoor: body.houseDoor,
      houseStreet: body.houseStreet,
      houseArea: body.houseArea,
      houseLocation: body.houseLocation,
      housePin: body.housePin,

      // Additional Details
      techniciansCount: body.techniciansCount,
      appliances: body.appliances,

      // Qualifications
      academicQualification: body.academicQualification,
      technicalQualification: body.technicalQualification,

      // Emergency & Other Details
      bloodGroup: body.bloodGroup,
      oldId: body.oldId,
      emergencyContact: body.emergencyContact,
      emergencyRelation: body.emergencyRelation,
      experience: body.experience,
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
    const nameParts = applicationData.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Prepare shop address
    const shopAddress = `${applicationData.shopDoor}, ${applicationData.shopStreet}, ${applicationData.shopArea}, ${applicationData.shopLocation} - ${applicationData.shopPin}`;

    // Prepare house address
    const houseAddress = `${applicationData.houseDoor}, ${applicationData.houseStreet}, ${applicationData.houseArea}, ${applicationData.houseLocation} - ${applicationData.housePin}`;

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
      `Appliances: ${applicationData.appliances}\nTechnicians Available: ${applicationData.techniciansCount}\nExperience: ${applicationData.experience}\nFather: ${applicationData.fatherName}\nSpouse: ${applicationData.spouseName || 'N/A'}\nSpouse Phone: ${applicationData.spouseMobile || 'N/A'}\nOld ID: ${applicationData.oldId || 'N/A'}\nAadhaar: ${applicationData.aadhaar}\nPAN: ${applicationData.pan}`,
      applicationData.emergencyRelation,
      applicationData.emergencyContact,
      applicationData.emergencyRelation,
      applicationData.bloodGroup.toUpperCase(),
      fileUrls.idProof || null,
      fileUrls.certificates || null,
      'Pending Approval',
      new Date(),
      new Date()
    ];

    const result = await executeQuery(insertQuery, values);

    // If successful, also create entries in worker_services table for appliances
    if (result.insertId) {
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
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit application. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
