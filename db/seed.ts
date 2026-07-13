import { db } from './index'
import {
  departments,
  specialties,
  users,
  insurances,
  patients,
  services,
  medicalActs,
  invoices,
  invoiceItems,
  payments,
  cashRegister,
  provinces,
  communes,
  zones,
  quartiers,
  labTests,
  labTestParameters,
} from './schema'

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Clear existing administrative data
    await db.delete(quartiers)
    await db.delete(zones)
    await db.delete(communes)
    await db.delete(provinces)

    console.log('🌍 Seeding Burundi provinces, communes, and quartiers...')

    // Burundi Provinces with Communes and Quartiers (2023 Reform)
    const burundi_data = [
      {
        province: 'Bujumbura',
        communes: [
          { name: 'Bubanza', quartiers: ['Bubanza Centre'] },
          { name: 'Bukinanyana', quartiers: ['Bukinanyana Centre'] },
          { name: 'Cibitoke', quartiers: ['Cibitoke Centre'] },
          { name: 'Isare', quartiers: ['Isare Centre'] },
          { name: 'Mpanda', quartiers: ['Mpanda Centre'] },
          { name: 'Mugere', quartiers: ['Mugere Centre'] },
          { name: 'Mugina', quartiers: ['Mugina Centre'] },
          { name: 'Muhuta', quartiers: ['Muhuta Centre'] },
          { name: 'Mukaza', quartiers: ['Mukaza Centre'] },
          { name: 'Ntahangwa', quartiers: ['Ntahangwa Centre'] },
          { name: 'Rwibaga', quartiers: ['Rwibaga Centre'] },
        ]
      },
      {
        province: 'Buhumuza',
        communes: [
          { name: 'Butaganzwa', quartiers: ['Butaganzwa Centre'] },
          { name: 'Butihinda', quartiers: ['Butihinda Centre'] },
          { name: 'Cankuzo', quartiers: ['Cankuzo Centre'] },
          { name: 'Gisagara', quartiers: ['Gisagara Centre'] },
          { name: 'Gisuru', quartiers: ['Gisuru Centre'] },
          { name: 'Muyinga', quartiers: ['Muyinga Centre'] },
          { name: 'Ruyigi', quartiers: ['Ruyigi Centre'] },
        ]
      },
      {
        province: 'Burunga',
        communes: [
          { name: 'Bururi', quartiers: ['Bururi Centre'] },
          { name: 'Makamba', quartiers: ['Makamba Centre'] },
          { name: 'Matana', quartiers: ['Matana Centre'] },
          { name: 'Musongati', quartiers: ['Musongati Centre'] },
          { name: 'Nyanza', quartiers: ['Nyanza-Lac Centre'] },
          { name: 'Rumonge', quartiers: ['Rumonge Centre'] },
          { name: 'Rutana', quartiers: ['Rutana Centre'] },
        ]
      },
      {
        province: 'Butanyerera',
        communes: [
          { name: 'Busoni', quartiers: ['Busoni Centre'] },
          { name: 'Kayanza', quartiers: ['Kayanza Centre'] },
          { name: 'Kiremba', quartiers: ['Kiremba Centre'] },
          { name: 'Kirundo', quartiers: ['Kirundo Centre'] },
          { name: 'Matongo', quartiers: ['Matongo Centre'] },
          { name: 'Muhanga', quartiers: ['Muhanga Centre'] },
          { name: 'Ngozi', quartiers: ['Ngozi Centre'] },
          { name: 'Tangara', quartiers: ['Tangara Centre'] },
        ]
      },
      {
        province: 'Gitega',
        communes: [
          { name: 'Bugendana', quartiers: ['Bugendana Centre'] },
          { name: 'Gishubi', quartiers: ['Gishubi Centre'] },
          { name: 'Gitega', quartiers: ['Gitega Centre'] },
          { name: 'Karusi', quartiers: ['Karusi Centre'] },
          { name: 'Kiganda', quartiers: ['Kiganda Centre'] },
          { name: 'Muramvya', quartiers: ['Muramvya Centre'] },
          { name: 'Mwaro', quartiers: ['Mwaro Centre'] },
          { name: 'Nyabihanga', quartiers: ['Nyabihanga Centre'] },
          { name: 'Shombo', quartiers: ['Shombo Centre'] },
        ]
      },
    ]

    const provinceMap: Record<string, string> = {}
    const communeMap: Record<string, string> = {}

    for (const prov_data of burundi_data) {
      // Insert province
      const [province] = await db.insert(provinces).values({ name: prov_data.province }).returning()
      provinceMap[prov_data.province] = province.id

      for (const comm_data of prov_data.communes) {
        // Insert commune
        const [commune] = await db
          .insert(communes)
          .values({ name: comm_data.name, provinceId: province.id })
          .returning()
        communeMap[`${prov_data.province}/${comm_data.name}`] = commune.id

        // Insert a default zone for each commune to satisfy the schema's zoneId Not-Null constraint
        const [zone] = await db
          .insert(zones)
          .values({ name: comm_data.name, communeId: commune.id })
          .returning()

        // Insert quartiers for this commune (linked via the zone)
        const quartier_values = comm_data.quartiers.map((q) => ({
          name: q,
          zoneId: zone.id,
        }))
        await db.insert(quartiers).values(quartier_values)
      }
    }


    console.log('✅ Burundi administrative divisions seeded!')

    console.log('📋 Seeding departments...')
    const deptResults = await db
      .insert(departments)
      .values([
        { name: 'Cardiology', description: 'Heart and cardiovascular system', isActive: true },
        { name: 'Neurology', description: 'Brain and nervous system disorders', isActive: true },
        { name: 'Orthopedics', description: 'Musculoskeletal system', isActive: true },
        { name: 'Pediatrics', description: 'Medical care for infants and children', isActive: true },
        { name: 'Radiology', description: 'Medical imaging and diagnostics', isActive: false },
        { name: 'General Surgery', description: 'Operative procedures on the body', isActive: true },
      ])
      .returning()

    const deptMap = deptResults.reduce(
      (acc, dept) => {
        acc[dept.name] = dept.id
        return acc
      },
      {} as Record<string, string>
    )

    console.log('📋 Seeding specialties...')
    const specResults = await db
      .insert(specialties)
      .values([
        {
          name: 'Interventional Cardiology',
          departmentId: deptMap['Cardiology'],
          description: 'Catheter-based treatments',
          isActive: true,
        },
        {
          name: 'Electrophysiology',
          departmentId: deptMap['Cardiology'],
          description: 'Heart rhythm disorders',
          isActive: true,
        },
        {
          name: 'Neurophysiology',
          departmentId: deptMap['Neurology'],
          description: 'Nervous system function testing',
          isActive: true,
        },
        {
          name: 'Sports Medicine',
          departmentId: deptMap['Orthopedics'],
          description: 'Athletic injury treatment',
          isActive: true,
        },
        {
          name: 'Neonatology',
          departmentId: deptMap['Pediatrics'],
          description: 'Newborn intensive care',
          isActive: true,
        },
        {
          name: 'Trauma Surgery',
          departmentId: deptMap['General Surgery'],
          description: 'Emergency surgical interventions',
          isActive: true,
        },
      ])
      .returning()

    const specMap = specResults.reduce(
      (acc, spec) => {
        acc[spec.name] = spec.id
        return acc
      },
      {} as Record<string, string>
    )

    console.log('👨‍⚕️  Création des médecins...')
    const doctorUsers = [
      { username: 'sarah.chen', fullName: 'Sarah Chen', role: 'doctor', specialtyId: specMap['Interventional Cardiology'], phone: '+1-555-0101' },
      { username: 'james.wilson', fullName: 'James Wilson', role: 'doctor', specialtyId: specMap['Electrophysiology'], phone: '+1-555-0102' },
      { username: 'maria.garcia', fullName: 'Maria Garcia', role: 'doctor', specialtyId: specMap['Neurophysiology'], phone: '+1-555-0103' },
      { username: 'robert.kim', fullName: 'Robert Kim', role: 'doctor', specialtyId: specMap['Sports Medicine'], phone: '+1-555-0104' },
      { username: 'emily.johnson', fullName: 'Emily Johnson', role: 'doctor', specialtyId: specMap['Neonatology'], phone: '+1-555-0105' },
      { username: 'david.brown', fullName: 'David Brown', role: 'doctor', specialtyId: specMap['Trauma Surgery'], phone: '+1-555-0106' },
      { username: 'lisa.patel', fullName: 'Lisa Patel', role: 'doctor', specialtyId: specMap['Interventional Cardiology'], phone: '+1-555-0107' },
      { username: 'michael.lee', fullName: 'Michael Lee', role: 'doctor', specialtyId: specMap['Neurophysiology'], phone: '+1-555-0108' },
    ]

    await db.insert(users).values(
      doctorUsers.map((du) => ({
        ...du,
        passwordHash: '$2b$10$placeholder',
        email: `${du.username}@clinic.com`,
        licenseNumber: `LIC-${du.username.split('.')[0].toUpperCase()}`,
        isActive: true,
      }))
    )

    console.log('🏥 Seeding insurances...')
    const insResults = await db
      .insert(insurances)
      .values([
        { name: 'National Health Insurance', contactInfo: '+1-800-555-0100', isActive: true },
        { name: 'BlueCross Premium', contactInfo: '+1-800-555-0200', isActive: true },
        { name: 'MediGuard International', contactInfo: '+1-800-555-0300', isActive: true },
        { name: 'SafeHealth Plus', contactInfo: '+1-800-555-0400', isActive: false },
      ])
      .returning()

    const insMap = insResults.reduce(
      (acc, ins) => {
        acc[ins.name] = ins.id
        return acc
      },
      {} as Record<string, string>
    )

    console.log('👥 Seeding patients...')
    const patResults = await db
      .insert(patients)
      .values([
        {
          firstName: 'Alice',
          lastName: 'Martin',
          dateOfBirth: '1985-03-15',
          gender: 'Female',
          phone: '+1-555-1001',
          isInsured: true,
          insuranceId: insMap['National Health Insurance'],
          insuranceNumber: 'NHI-20853-A',
        },
        {
          firstName: 'Bob',
          lastName: 'Thompson',
          dateOfBirth: '1972-07-22',
          gender: 'Male',
          phone: '+1-555-1002',
          isInsured: true,
          insuranceId: insMap['BlueCross Premium'],
          insuranceNumber: 'BCP-44721-B',
        },
        {
          firstName: 'Clara',
          lastName: 'Rodriguez',
          dateOfBirth: '1990-11-08',
          gender: 'Female',
          phone: '+1-555-1003',
          isInsured: false,
        },
        {
          firstName: 'Daniel',
          lastName: 'Nguyen',
          dateOfBirth: '1968-05-30',
          gender: 'Male',
          phone: '+1-555-1004',
          isInsured: true,
          insuranceId: insMap['MediGuard International'],
          insuranceNumber: 'MGI-77234-D',
        },
        {
          firstName: 'Emma',
          lastName: 'Davis',
          dateOfBirth: '2001-09-14',
          gender: 'Female',
          phone: '+1-555-1005',
          isInsured: false,
        },
        {
          firstName: 'Frank',
          lastName: 'Miller',
          dateOfBirth: '1955-12-01',
          gender: 'Male',
          phone: '+1-555-1006',
          isInsured: true,
          insuranceId: insMap['National Health Insurance'],
          insuranceNumber: 'NHI-33198-F',
        },
        {
          firstName: 'Grace',
          lastName: 'Taylor',
          dateOfBirth: '1998-01-25',
          gender: 'Female',
          phone: '+1-555-1007',
          isInsured: true,
          insuranceId: insMap['BlueCross Premium'],
          insuranceNumber: 'BCP-88412-G',
        },
        {
          firstName: 'Henry',
          lastName: 'Anderson',
          dateOfBirth: '1980-06-18',
          gender: 'Male',
          phone: '+1-555-1008',
          isInsured: false,
        },
      ])
      .returning()

    const patMap = patResults.reduce(
      (acc, pat) => {
        acc[`${pat.firstName} ${pat.lastName}`] = pat.id
        return acc
      },
      {} as Record<string, string>
    )

    console.log('🏢 Seeding services...')
    const svcResults = await db
      .insert(services)
      .values([
        { name: 'Consultation', code: 'CONS', isBillable: true, isActive: true },
        { name: 'Laboratory', code: 'LAB', isBillable: true, isActive: true },
        { name: 'Imaging', code: 'IMG', isBillable: true, isActive: true },
        { name: 'Surgery', code: 'SURG', isBillable: true, isActive: true },
        { name: 'Hospitalization', code: 'HOSP', isBillable: true, isActive: true },
        { name: 'Pharmacy', code: 'PHAR', isBillable: true, isActive: false },
      ])
      .returning()

    const svcMap = svcResults.reduce(
      (acc, svc) => {
        acc[svc.code] = svc.id
        return acc
      },
      {} as Record<string, string>
    )

    console.log('💊 Seeding medical acts...')
    const actsResults = await db
      .insert(medicalActs)
      .values([
        {
          code: 'CONS-GEN',
          name: 'General Consultation',
          serviceId: svcMap['CONS'],
          basePrice: '50.00',
          requiresAuthorization: false,
          isActive: true,
        },
        {
          code: 'CONS-SPEC',
          name: 'Specialist Consultation',
          serviceId: svcMap['CONS'],
          specialtyId: specMap['Interventional Cardiology'],
          basePrice: '120.00',
          requiresAuthorization: false,
          isActive: true,
        },
        {
          code: 'LAB-CBC',
          name: 'Complete Blood Count',
          serviceId: svcMap['LAB'],
          basePrice: '35.00',
          requiresAuthorization: false,
          isActive: true,
        },
        {
          code: 'LAB-BIO',
          name: 'Biochemistry Panel',
          serviceId: svcMap['LAB'],
          basePrice: '80.00',
          requiresAuthorization: false,
          isActive: true,
        },
        {
          code: 'IMG-XRAY',
          name: 'X-Ray',
          serviceId: svcMap['IMG'],
          basePrice: '75.00',
          requiresAuthorization: false,
          isActive: true,
        },
        {
          code: 'IMG-MRI',
          name: 'MRI Scan',
          serviceId: svcMap['IMG'],
          specialtyId: specMap['Neurophysiology'],
          basePrice: '450.00',
          requiresAuthorization: true,
          isActive: true,
        },
        {
          code: 'IMG-CT',
          name: 'CT Scan',
          serviceId: svcMap['IMG'],
          basePrice: '350.00',
          requiresAuthorization: true,
          isActive: true,
        },
        {
          code: 'SURG-MIN',
          name: 'Minor Surgery',
          serviceId: svcMap['SURG'],
          specialtyId: specMap['Trauma Surgery'],
          basePrice: '800.00',
          requiresAuthorization: true,
          isActive: true,
        },
        {
          code: 'SURG-MAJ',
          name: 'Major Surgery',
          serviceId: svcMap['SURG'],
          specialtyId: specMap['Trauma Surgery'],
          basePrice: '3500.00',
          requiresAuthorization: true,
          isActive: true,
        },
        {
          code: 'HOSP-DAY',
          name: 'Day Hospitalization',
          serviceId: svcMap['HOSP'],
          basePrice: '200.00',
          requiresAuthorization: false,
          isActive: true,
        },
        {
          code: 'ECG-REST',
          name: 'Resting ECG',
          serviceId: svcMap['CONS'],
          specialtyId: specMap['Electrophysiology'],
          basePrice: '60.00',
          requiresAuthorization: false,
          isActive: true,
        },
        {
          code: 'ECHO-CARD',
          name: 'Echocardiogram',
          serviceId: svcMap['IMG'],
          specialtyId: specMap['Interventional Cardiology'],
          basePrice: '250.00',
          requiresAuthorization: false,
          isActive: true,
        },
      ])
      .returning()

    const actsMap = actsResults.reduce(
      (acc, act) => {
        acc[act.code] = act.id
        return acc
      },
      {} as Record<string, string>
    )

    // insurance service rules removed — no DB seed for per-service rules

    console.log('🏥 Seeding cash register...')
    await db.insert(cashRegister).values([
      {
        name: 'Main Reception',
        description: 'Primary cash register at reception desk',
        isActive: true,
      },
      {
        name: 'Emergency Ward',
        description: 'Emergency department cash point',
        isActive: true,
      },
    ])

    console.log('🔬 Seeding lab test catalog...')
    const labTestsData = await db
      .insert(labTests)
      .values([
        {
          code: 'NFS',
          name: 'Numération Formule Sanguine',
          serviceId: svcMap['LAB'],
          testType: 'hematology',
          price: '25.00',
          turnaroundTimeHours: '2',
          description: 'Hémogramme complet avec formule leucocytaire et numération plaquettaire',
        },
        {
          code: 'GLYC',
          name: 'Glycémie à Jeun',
          serviceId: svcMap['LAB'],
          testType: 'chemistry',
          price: '10.00',
          turnaroundTimeHours: '1',
          description: 'Glycémie veineuse à jeun (Fasting Blood Glucose)',
        },
        {
          code: 'CRP',
          name: 'CRP (Protéine C Réactive)',
          serviceId: svcMap['LAB'],
          testType: 'immunology',
          price: '15.00',
          turnaroundTimeHours: '2',
          description: 'Dosage de la Protéine C Réactive, marqueur de l\'inflammation',
        },
        {
          code: 'UREA-CREAT',
          name: 'Urée + Créatinine',
          serviceId: svcMap['LAB'],
          testType: 'chemistry',
          price: '15.00',
          turnaroundTimeHours: '2',
          description: 'Bilan rénal (Urée et Créatinine sanguines)',
        },
        {
          code: 'BILAN-HEP',
          name: 'Bilan Hépatique',
          serviceId: svcMap['LAB'],
          testType: 'chemistry',
          price: '35.00',
          turnaroundTimeHours: '3',
          description: 'Bilan hépatique complet (ALAT, ASAT, PAL, GGT, Bilirubines)',
        },
        {
          code: 'BILAN-LIP',
          name: 'Bilan Lipidique',
          serviceId: svcMap['LAB'],
          testType: 'chemistry',
          price: '30.00',
          turnaroundTimeHours: '3',
          description: 'Profil lipidique (Cholestérol total, HDL, LDL, Triglycérides)',
        },
        {
          code: 'SEDIMENT',
          name: 'Sédiment Urinaire',
          serviceId: svcMap['LAB'],
          testType: 'urinalysis',
          price: '20.00',
          turnaroundTimeHours: '2',
          description: 'Examen cytobactériologique des urines (ECBU)',
        },
        {
          code: 'VS',
          name: 'Vitesse de Sédimentation',
          serviceId: svcMap['LAB'],
          testType: 'hematology',
          price: '10.00',
          turnaroundTimeHours: '2',
          description: 'Vitesse de sédimentation (VS) à H1 et H2',
        },
        {
          code: 'VIH-SERO',
          name: 'Sérologie VIH',
          serviceId: svcMap['LAB'],
          testType: 'serology',
          price: '15.00',
          turnaroundTimeHours: '24',
          description: 'Test sérologique VIH (dépistage)',
        },
        {
          code: 'GROUP-RH',
          name: 'Groupage Rhésus',
          serviceId: svcMap['LAB'],
          testType: 'immunology',
          price: '12.00',
          turnaroundTimeHours: '1',
          description: 'Groupage sanguin ABO et Rhésus D',
        },
        {
          code: 'TP-TCA',
          name: 'TP / TCA (Hémostase)',
          serviceId: svcMap['LAB'],
          testType: 'hematology',
          price: '25.00',
          turnaroundTimeHours: '3',
          description: 'Bilan de coagulation (Taux de Prothrombine, TCA)',
        },
        {
          code: 'IONO',
          name: 'Ionogramme Sanguin',
          serviceId: svcMap['LAB'],
          testType: 'chemistry',
          price: '20.00',
          turnaroundTimeHours: '2',
          description: 'Ionogramme sanguin (Na+, K+, Cl-, Ca2+)',
        },
      ])
      .returning()

    const labTestMap = labTestsData.reduce(
      (acc, t) => {
        acc[t.code] = t.id
        return acc
      },
      {} as Record<string, string>
    )

    console.log('📋 Seeding lab test parameters...')
    await db.insert(labTestParameters).values([
      // === NFS Parameters ===
      { labTestId: labTestMap['NFS'], parameterCode: 'WBC', parameterName: 'Globules Blancs (GB)', unit: '/mm³', referenceRangeLow: '4.0', referenceRangeHigh: '10.0', sortOrder: '1' },
      { labTestId: labTestMap['NFS'], parameterCode: 'RBC', parameterName: 'Globules Rouges (GR)', unit: '10⁶/mm³', maleRefRangeLow: '4.5', maleRefRangeHigh: '6.0', femaleRefRangeLow: '4.0', femaleRefRangeHigh: '5.4', sortOrder: '2' },
      { labTestId: labTestMap['NFS'], parameterCode: 'HGB', parameterName: 'Hémoglobine (Hb)', unit: 'g/dL', maleRefRangeLow: '13.0', maleRefRangeHigh: '17.0', femaleRefRangeLow: '12.0', femaleRefRangeHigh: '15.0', sortOrder: '3' },
      { labTestId: labTestMap['NFS'], parameterCode: 'HCT', parameterName: 'Hématocrite (Ht)', unit: '%', maleRefRangeLow: '40', maleRefRangeHigh: '52', femaleRefRangeLow: '36', femaleRefRangeHigh: '46', sortOrder: '4' },
      { labTestId: labTestMap['NFS'], parameterCode: 'MCV', parameterName: 'Volume Globulaire Moyen (VGM)', unit: 'fL', referenceRangeLow: '80', referenceRangeHigh: '100', sortOrder: '5' },
      { labTestId: labTestMap['NFS'], parameterCode: 'MCH', parameterName: 'Teneur Corpusculaire Hb (TCMH)', unit: 'pg', referenceRangeLow: '27', referenceRangeHigh: '34', sortOrder: '6' },
      { labTestId: labTestMap['NFS'], parameterCode: 'MCHC', parameterName: 'Concentration Corpusculaire Hb (CCMH)', unit: 'g/dL', referenceRangeLow: '32', referenceRangeHigh: '36', sortOrder: '7' },
      { labTestId: labTestMap['NFS'], parameterCode: 'PLT', parameterName: 'Plaquettes', unit: '/mm³', referenceRangeLow: '150000', referenceRangeHigh: '450000', sortOrder: '8' },
      { labTestId: labTestMap['NFS'], parameterCode: 'NEUT', parameterName: 'Neutrophiles', unit: '%', referenceRangeLow: '40', referenceRangeHigh: '75', sortOrder: '9' },
      { labTestId: labTestMap['NFS'], parameterCode: 'LYMPH', parameterName: 'Lymphocytes', unit: '%', referenceRangeLow: '20', referenceRangeHigh: '45', sortOrder: '10' },
      { labTestId: labTestMap['NFS'], parameterCode: 'MONO', parameterName: 'Monocytes', unit: '%', referenceRangeLow: '2', referenceRangeHigh: '10', sortOrder: '11' },
      { labTestId: labTestMap['NFS'], parameterCode: 'EO', parameterName: 'Éosinophiles', unit: '%', referenceRangeLow: '0', referenceRangeHigh: '5', sortOrder: '12' },
      { labTestId: labTestMap['NFS'], parameterCode: 'BASO', parameterName: 'Basophiles', unit: '%', referenceRangeLow: '0', referenceRangeHigh: '2', sortOrder: '13' },

      // === Glycémie ===
      { labTestId: labTestMap['GLYC'], parameterCode: 'GLU', parameterName: 'Glucose (à jeun)', unit: 'mmol/L', referenceRangeLow: '3.9', referenceRangeHigh: '6.1', sortOrder: '1' },

      // === CRP ===
      { labTestId: labTestMap['CRP'], parameterCode: 'CRP', parameterName: 'CRP', unit: 'mg/L', referenceRangeLow: '0', referenceRangeHigh: '5', sortOrder: '1' },

      // === Urée + Créatinine ===
      { labTestId: labTestMap['UREA-CREAT'], parameterCode: 'UREA', parameterName: 'Urée', unit: 'mmol/L', referenceRangeLow: '2.5', referenceRangeHigh: '7.5', sortOrder: '1' },
      { labTestId: labTestMap['UREA-CREAT'], parameterCode: 'CREAT', parameterName: 'Créatinine', unit: 'µmol/L', maleRefRangeLow: '62', maleRefRangeHigh: '106', femaleRefRangeLow: '44', femaleRefRangeHigh: '80', sortOrder: '2' },

      // === Bilan Hépatique ===
      { labTestId: labTestMap['BILAN-HEP'], parameterCode: 'ALAT', parameterName: 'ALAT (TGP)', unit: 'U/L', referenceRangeLow: '5', referenceRangeHigh: '40', sortOrder: '1' },
      { labTestId: labTestMap['BILAN-HEP'], parameterCode: 'ASAT', parameterName: 'ASAT (TGO)', unit: 'U/L', referenceRangeLow: '5', referenceRangeHigh: '40', sortOrder: '2' },
      { labTestId: labTestMap['BILAN-HEP'], parameterCode: 'PAL', parameterName: 'Phosphatases Alcalines', unit: 'U/L', referenceRangeLow: '30', referenceRangeHigh: '120', sortOrder: '3' },
      { labTestId: labTestMap['BILAN-HEP'], parameterCode: 'GGT', parameterName: 'Gamma-GT', unit: 'U/L', referenceRangeLow: '5', referenceRangeHigh: '55', sortOrder: '4' },
      { labTestId: labTestMap['BILAN-HEP'], parameterCode: 'BILIT', parameterName: 'Bilirubine Totale', unit: 'mg/L', referenceRangeLow: '2', referenceRangeHigh: '12', sortOrder: '5' },
      { labTestId: labTestMap['BILAN-HEP'], parameterCode: 'BILID', parameterName: 'Bilirubine Directe', unit: 'mg/L', referenceRangeLow: '0', referenceRangeHigh: '4', sortOrder: '6' },
      { labTestId: labTestMap['BILAN-HEP'], parameterCode: 'BILII', parameterName: 'Bilirubine Indirecte', unit: 'mg/L', referenceRangeLow: '0', referenceRangeHigh: '8', sortOrder: '7' },

      // === Bilan Lipidique ===
      { labTestId: labTestMap['BILAN-LIP'], parameterCode: 'CHOL-T', parameterName: 'Cholestérol Total', unit: 'mmol/L', referenceRangeLow: '3.5', referenceRangeHigh: '5.2', sortOrder: '1' },
      { labTestId: labTestMap['BILAN-LIP'], parameterCode: 'HDL', parameterName: 'HDL-Cholestérol', unit: 'mmol/L', referenceRangeLow: '1.0', referenceRangeHigh: '1.6', sortOrder: '2' },
      { labTestId: labTestMap['BILAN-LIP'], parameterCode: 'LDL', parameterName: 'LDL-Cholestérol', unit: 'mmol/L', referenceRangeLow: '0', referenceRangeHigh: '3.4', sortOrder: '3' },
      { labTestId: labTestMap['BILAN-LIP'], parameterCode: 'TG', parameterName: 'Triglycérides', unit: 'mmol/L', referenceRangeLow: '0', referenceRangeHigh: '1.7', sortOrder: '4' },

      // === Sédiment Urinaire ===
      { labTestId: labTestMap['SEDIMENT'], parameterCode: 'ASPECT', parameterName: 'Aspect', unit: '', referenceRangeText: 'Clair', sortOrder: '1' },
      { labTestId: labTestMap['SEDIMENT'], parameterCode: 'COLOR', parameterName: 'Couleur', unit: '', referenceRangeText: 'Jaune pâle', sortOrder: '2' },
      { labTestId: labTestMap['SEDIMENT'], parameterCode: 'PH', parameterName: 'pH', unit: '', referenceRangeLow: '4.5', referenceRangeHigh: '8.0', sortOrder: '3' },
      { labTestId: labTestMap['SEDIMENT'], parameterCode: 'DENSITY', parameterName: 'Densité', unit: '', referenceRangeLow: '1.005', referenceRangeHigh: '1.030', sortOrder: '4' },
      { labTestId: labTestMap['SEDIMENT'], parameterCode: 'PROT', parameterName: 'Protéines', unit: 'g/L', referenceRangeLow: '0', referenceRangeHigh: '0.15', sortOrder: '5' },
      { labTestId: labTestMap['SEDIMENT'], parameterCode: 'GLU-U', parameterName: 'Glucose', unit: '', referenceRangeText: 'Négatif', sortOrder: '6' },
      { labTestId: labTestMap['SEDIMENT'], parameterCode: 'LEUKO', parameterName: 'Leucocytes', unit: '/mm³', referenceRangeLow: '0', referenceRangeHigh: '5', sortOrder: '7' },
      { labTestId: labTestMap['SEDIMENT'], parameterCode: 'NITRITE', parameterName: 'Nitrites', unit: '', referenceRangeText: 'Négatif', sortOrder: '8' },

      // === VS ===
      { labTestId: labTestMap['VS'], parameterCode: 'VSH1', parameterName: 'VS 1ère heure', unit: 'mm', maleRefRangeLow: '0', maleRefRangeHigh: '15', femaleRefRangeLow: '0', femaleRefRangeHigh: '20', sortOrder: '1' },
      { labTestId: labTestMap['VS'], parameterCode: 'VSH2', parameterName: 'VS 2e heure', unit: 'mm', maleRefRangeLow: '0', maleRefRangeHigh: '30', femaleRefRangeLow: '0', femaleRefRangeHigh: '40', sortOrder: '2' },

      // === VIH Sérologie ===
      { labTestId: labTestMap['VIH-SERO'], parameterCode: 'VIH', parameterName: 'Sérologie VIH', unit: '', referenceRangeText: 'Négatif', sortOrder: '1' },

      // === Groupage Rhésus ===
      { labTestId: labTestMap['GROUP-RH'], parameterCode: 'ABO', parameterName: 'Groupe ABO', unit: '', referenceRangeText: 'A/B/AB/O', sortOrder: '1' },
      { labTestId: labTestMap['GROUP-RH'], parameterCode: 'RHESUS', parameterName: 'Rhésus D', unit: '', referenceRangeText: 'Positif/Négatif', sortOrder: '2' },

      // === TP / TCA ===
      { labTestId: labTestMap['TP-TCA'], parameterCode: 'TP', parameterName: 'Taux de Prothrombine (TP)', unit: '%', referenceRangeLow: '70', referenceRangeHigh: '100', sortOrder: '1' },
      { labTestId: labTestMap['TP-TCA'], parameterCode: 'INR', parameterName: 'INR', unit: '', referenceRangeLow: '0.8', referenceRangeHigh: '1.2', sortOrder: '2' },
      { labTestId: labTestMap['TP-TCA'], parameterCode: 'TCA', parameterName: 'TCA (Temps de Céphaline Activée)', unit: 'sec', referenceRangeLow: '25', referenceRangeHigh: '40', sortOrder: '3' },

      // === Ionogramme ===
      { labTestId: labTestMap['IONO'], parameterCode: 'NA', parameterName: 'Sodium (Na+)', unit: 'mmol/L', referenceRangeLow: '135', referenceRangeHigh: '145', sortOrder: '1' },
      { labTestId: labTestMap['IONO'], parameterCode: 'K', parameterName: 'Potassium (K+)', unit: 'mmol/L', referenceRangeLow: '3.5', referenceRangeHigh: '5.0', sortOrder: '2' },
      { labTestId: labTestMap['IONO'], parameterCode: 'CL', parameterName: 'Chlore (Cl-)', unit: 'mmol/L', referenceRangeLow: '98', referenceRangeHigh: '107', sortOrder: '3' },
      { labTestId: labTestMap['IONO'], parameterCode: 'CA', parameterName: 'Calcium (Ca2+)', unit: 'mmol/L', referenceRangeLow: '2.15', referenceRangeHigh: '2.55', sortOrder: '4' },
    ])

    console.log('✅ Database seeded successfully!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seed()
