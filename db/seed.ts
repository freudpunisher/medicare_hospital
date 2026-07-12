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

    console.log('✅ Database seeded successfully!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seed()
