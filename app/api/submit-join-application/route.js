// app/api/submit-join-application/route.js
import { executeQuery } from '../../../lib/db';
import { put } from '@vercel/blob';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max per file

export async function POST(request) {
  try {
    // Parse form data including files
    const formData = await request.formData();

    // Extract all form fields
    const applicationData = {
      // Personal Details
      idNumber: formData.get('idNumber'),
      fullName: formData.get('fullName'),
      dob: formData.get('dob'),
      aadhaar: formData.get('aadhaar'),
      mobile1: formData.get('mobile1'),
      mobile2: formData.get('mobile2'),
      pan: formData.get('pan'),
      email: formData.get('email'),

      // Bank Details
      bankName: formData.get('bankName'),
      branch: formData.get('branch'),
      ifsc: formData.get('ifsc'),
      accountType: formData.get('accountType'),
      accountNumber: formData.get('accountNumber'),

      // Shop Details
      shopName: formData.get('shopName'),
      shopDoor: formData.get('shopDoor'),
      shopStreet: formData.get('shopStreet'),
      shopArea: formData.get('shopArea'),
      shopLocation: formData.get('shopLocation'),
      shopPin: formData.get('shopPin'),

      // House Details
      fatherName: formData.get('fatherName'),
      maritalStatus: formData.get('maritalStatus'),
      spouseName: formData.get('spouseName'),
      spouseMobile: formData.get('spouseMobile'),
      houseDoor: formData.get('houseDoor'),
      houseStreet: formData.get('houseStreet'),
      houseArea: formData.get('houseArea'),
      houseLocation: formData.get('houseLocation'),
      housePin: formData.get('housePin'),

      // Additional Details
      techniciansCount: formData.get('techniciansCount'),
      appliances: formData.get('appliances'),

      // Qualifications
      academicQualification: formData.get('academicQualification'),
      technicalQualification: formData.get('technicalQualification'),

      // Emergency & Other Details
      bloodGroup: formData.get('bloodGroup'),
      oldId: formData.get('oldId'),
      emergencyContact: formData.get('emergencyContact'),
      emergencyRelation: formData.get('emergencyRelation'),
      experience: formData.get('experience'),
    };

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

    // Handle file uploads using Vercel Blob
    const sanitizedName = applicationData.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedIdNumber = applicationData.idNumber.replace(/[^a-zA-Z0-9]/g, '_');
    const folderName = `${sanitizedName}-${sanitizedIdNumber}`;

    const fileUrls = {};
    const files = ['photo', 'idProof', 'certificates'];

    for (const fileField of files) {
      const file = formData.get(fileField);
      if (file && file instanceof File && file.size > 0) {
        // Validate file size on server side
        if (file.size > MAX_FILE_SIZE) {
          return new Response(JSON.stringify({
            success: false,
            error: `File "${file.name}" is too large. Maximum size is 5MB.`
          }), {
            status: 413,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        try {
          // Get file extension
          const fileExtension = file.name.split('.').pop() || 'jpg';
          const blobPath = `workers/${folderName}/${fileField}.${fileExtension}`;

          // Upload to Vercel Blob
          const blob = await put(blobPath, file, {
            access: 'public',
            addRandomSuffix: false,
          });

          fileUrls[fileField] = blob.url;
        } catch (uploadError) {
          console.error(`Error uploading ${fileField}:`, uploadError);
          // Continue with other files even if one fails
        }
      }
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
      fileUrls.photo || null,
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
