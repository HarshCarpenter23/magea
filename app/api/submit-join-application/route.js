// pages/api/submit-join-application.js (or app/api/submit-join-application/route.js for App Router)

import { executeQuery } from '../../../lib/db';
import formidable from 'formidable';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// For App Router (app/api/submit-join-application/route.js)
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
      'idNumber', 'fullName', 'dob', 'aadhaar', 'mobile1', 'pan',
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

    // Handle file uploads - Create folder with name-identity_card_number format
    const sanitizedName = applicationData.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedIdNumber = applicationData.idNumber.replace(/[^a-zA-Z0-9]/g, '_');
    const folderName = `${sanitizedName}-${sanitizedIdNumber}`;
    const uploadDir = path.join(process.cwd(), 'uploads', folderName);
    await fs.mkdir(uploadDir, { recursive: true });

    const fileUrls = {};
    const files = ['photo', 'idProof', 'certificates'];

    for (const fileField of files) {
      const file = formData.get(fileField);
      if (file && file instanceof File) {
        const fileExtension = path.extname(file.name);
        const fileName = `${fileField}${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);

        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(filePath, buffer);

        fileUrls[fileField] = `/uploads/${folderName}/${fileName}`;
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
      null, // email not collected in form
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
        'BC (Bottle Cooler)': 7, // Map to water cooler service
        'WD (Water Dispenser)': 7, // Map to water cooler service
        'DF (Deep Freezer)': 8,
        'Package AC': 1, // Map to AC service
        'Cold rooms': 8, // Map to deep freezer service
        'FOW': 2 // Map to refrigerator service (assuming FOW is freezer-related)
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

// For Pages Router (pages/api/submit-join-application.js)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'public', 'uploads', 'temp'),
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      multiples: true
    });

    const [fields, files] = await form.parse(req);

    // Convert arrays to single values for single fields
    const getData = (field) => Array.isArray(fields[field]) ? fields[field][0] : fields[field];

    const applicationData = {
      // Personal Details
      idNumber: getData('idNumber'),
      fullName: getData('fullName'),
      dob: getData('dob'),
      aadhaar: getData('aadhaar'),
      mobile1: getData('mobile1'),
      mobile2: getData('mobile2'),
      pan: getData('pan'),
      
      // Bank Details
      bankName: getData('bankName'),
      branch: getData('branch'),
      ifsc: getData('ifsc'),
      accountType: getData('accountType'),
      accountNumber: getData('accountNumber'),
      
      // Shop Details
      shopName: getData('shopName'),
      shopDoor: getData('shopDoor'),
      shopStreet: getData('shopStreet'),
      shopArea: getData('shopArea'),
      shopLocation: getData('shopLocation'),
      shopPin: getData('shopPin'),
      
      // House Details
      fatherName: getData('fatherName'),
      maritalStatus: getData('maritalStatus'),
      spouseName: getData('spouseName'),
      spouseMobile: getData('spouseMobile'),
      houseDoor: getData('houseDoor'),
      houseStreet: getData('houseStreet'),
      houseArea: getData('houseArea'),
      houseLocation: getData('houseLocation'),
      housePin: getData('housePin'),
      
      // Additional Details
      techniciansCount: getData('techniciansCount'),
      appliances: getData('appliances'),
      
      // Qualifications
      academicQualification: getData('academicQualification'),
      technicalQualification: getData('technicalQualification'),
      
      // Emergency & Other Details
      bloodGroup: getData('bloodGroup'),
      oldId: getData('oldId'),
      emergencyContact: getData('emergencyContact'),
      emergencyRelation: getData('emergencyRelation'),
      experience: getData('experience'),
    };

    // Validate required fields
    const requiredFields = [
      'idNumber', 'fullName', 'dob', 'aadhaar', 'mobile1', 'pan',
      'bankName', 'branch', 'ifsc', 'accountType', 'accountNumber',
      'shopName', 'shopDoor', 'shopStreet', 'shopArea', 'shopLocation', 'shopPin',
      'fatherName', 'maritalStatus', 'houseDoor', 'houseStreet', 'houseArea', 'houseLocation', 'housePin',
      'techniciansCount', 'appliances', 'academicQualification', 'technicalQualification',
      'bloodGroup', 'emergencyContact', 'emergencyRelation', 'experience'
    ];

    const missingFields = requiredFields.filter(field => !applicationData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Handle file uploads - Create folder with name-identity_card_number format
    const sanitizedName = applicationData.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedIdNumber = applicationData.idNumber.replace(/[^a-zA-Z0-9]/g, '_');
    const folderName = `${sanitizedName}-${sanitizedIdNumber}`;
    const uploadDir = path.join(process.cwd(), 'uploads', folderName);
    await fs.mkdir(uploadDir, { recursive: true });

    const fileUrls = {};
    const fileFields = ['photo', 'idProof', 'certificates'];

    for (const fileField of fileFields) {
      const file = Array.isArray(files[fileField]) ? files[fileField][0] : files[fileField];
      if (file) {
        const fileExtension = path.extname(file.originalFilename || '');
        const fileName = `${fileField}${fileExtension}`;
        const newPath = path.join(uploadDir, fileName);

        await fs.copyFile(file.filepath, newPath);
        await fs.unlink(file.filepath); // Clean up temp file

        fileUrls[fileField] = `/uploads/${folderName}/${fileName}`;
      }
    }

    // Generate worker code
    const workerCode = `MAEGA${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Parse name into first and last name
    const nameParts = applicationData.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Prepare addresses
    const shopAddress = `${applicationData.shopDoor}, ${applicationData.shopStreet}, ${applicationData.shopArea}, ${applicationData.shopLocation} - ${applicationData.shopPin}`;
    const houseAddress = `${applicationData.houseDoor}, ${applicationData.houseStreet}, ${applicationData.houseArea}, ${applicationData.houseLocation} - ${applicationData.housePin}`;

    // Insert worker data into database
    const insertQuery = `
      INSERT INTO workers (
        worker_code, first_name, last_name, phone, date_of_birth,
        photo_url, address_line1, city, pincode,
        account_holder_name, account_number, account_type, bank_name, ifsc_code, branch_name,
        shop_name, shop_address,
        house_address, marital_status,
        academic_qualification, technical_qualification, other_qualifications,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        blood_group, id_proof_url, certificates_url,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      workerCode, firstName, lastName, applicationData.mobile1, applicationData.dob,
      fileUrls.photo || null, houseAddress, applicationData.houseArea, applicationData.housePin,
      applicationData.fullName, applicationData.accountNumber, applicationData.accountType,
      applicationData.bankName, applicationData.ifsc, applicationData.branch,
      applicationData.shopName, shopAddress,
      houseAddress, applicationData.maritalStatus,
      applicationData.academicQualification, applicationData.technicalQualification,
      `Appliances: ${applicationData.appliances}\nTechnicians: ${applicationData.techniciansCount}\nExperience: ${applicationData.experience}\nFather: ${applicationData.fatherName}\nSpouse: ${applicationData.spouseName || 'N/A'}\nAadhaar: ${applicationData.aadhaar}\nPAN: ${applicationData.pan}`,
      applicationData.emergencyRelation, applicationData.emergencyContact, applicationData.emergencyRelation,
      applicationData.bloodGroup.toUpperCase(), fileUrls.idProof || null, fileUrls.certificates || null,
      'Pending Approval', new Date(), new Date()
    ];

    const result = await executeQuery(insertQuery, values);

    // Create service mappings
    if (result.insertId) {
      const appliances = applicationData.appliances.split(',').map(a => a.trim());
      const applianceServiceMap = {
        'AC': 1, 'Refrigerator': 2, 'WC (Water Cooler)': 7,
        'BC (Bottle Cooler)': 7, 'WD (Water Dispenser)': 7,
        'DF (Deep Freezer)': 8, 'Package AC': 1,
        'Cold rooms': 8, 'FOW': 2
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

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      workerCode: workerCode,
      workerId: result.insertId
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit application. Please try again.'
    });
  }
}