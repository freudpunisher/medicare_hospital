import { db } from './index'
import { sql } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { chartAccounts, accountingMappings } from './schema'

interface AccountSeed {
  code: string
  label: string
  class: string
  type: string
  parentCode?: string
}

const accountsData: AccountSeed[] = [
  // ================= Classe 1: Comptes de capitaux =================
  { code: '10', label: 'FONDS PROPRES', class: '1', type: 'equity' },
  { code: '101', label: 'Capital', class: '1', type: 'equity', parentCode: '10' },
  { code: '104', label: 'Primes liées au capital', class: '1', type: 'equity', parentCode: '10' },
  { code: '106', label: 'Réserves', class: '1', type: 'equity', parentCode: '10' },
  { code: '1061', label: 'Réserve légale', class: '1', type: 'equity', parentCode: '106' },
  { code: '1068', label: 'Autres réserves', class: '1', type: 'equity', parentCode: '106' },
  { code: '108', label: "Compte de l'exploitant", class: '1', type: 'equity', parentCode: '10' },
  { code: '11', label: 'REPORT À NOUVEAU', class: '1', type: 'equity' },
  { code: '110', label: 'Report à nouveau créditeur', class: '1', type: 'equity', parentCode: '11' },
  { code: '119', label: 'Report à nouveau débiteur', class: '1', type: 'equity', parentCode: '11' },
  { code: '12', label: "RÉSULTAT DE L'EXERCICE", class: '1', type: 'equity' },
  { code: '13', label: 'SUBVENTIONS ET PROVISIONS RÉGLEMENTÉES', class: '1', type: 'equity' },
  { code: '131', label: "Subventions d'investissement", class: '1', type: 'equity', parentCode: '13' },
  { code: '15', label: 'PROVISIONS POUR RISQUES ET CHARGES', class: '1', type: 'liability' },
  { code: '151', label: 'Provisions pour litiges', class: '1', type: 'liability', parentCode: '15' },
  { code: '157', label: 'Provisions pour charges à répartir sur plusieurs exercices', class: '1', type: 'liability', parentCode: '15' },
  { code: '16', label: 'EMPRUNTS ET DETTES FINANCIÈRES', class: '1', type: 'liability' },
  { code: '161', label: 'Emprunts auprès des établissements de crédit', class: '1', type: 'liability', parentCode: '16' },
  { code: '165', label: 'Dépôts et cautionnements reçus', class: '1', type: 'liability', parentCode: '16' },
  { code: '167', label: 'Dettes à long terme', class: '1', type: 'liability', parentCode: '16' },

  // ================= Classe 2: Comptes d'immobilisations =================
  { code: '20', label: 'IMMOBILISATIONS INCORPORELLES', class: '2', type: 'asset' },
  { code: '201', label: "Frais d'établissement", class: '2', type: 'asset', parentCode: '20' },
  { code: '205', label: 'Logiciels, brevets et licences', class: '2', type: 'asset', parentCode: '20' },
  { code: '207', label: 'Fonds commercial', class: '2', type: 'asset', parentCode: '20' },
  { code: '21', label: 'IMMOBILISATIONS CORPORELLES', class: '2', type: 'asset' },
  { code: '211', label: 'Terrains', class: '2', type: 'asset', parentCode: '21' },
  { code: '212', label: 'Constructions', class: '2', type: 'asset', parentCode: '21' },
  { code: '2121', label: 'Bâtiments', class: '2', type: 'asset', parentCode: '212' },
  { code: '215', label: 'Matériel médical et technique', class: '2', type: 'asset', parentCode: '21' },
  { code: '218', label: 'Autres immobilisations corporelles', class: '2', type: 'asset', parentCode: '21' },
  { code: '2181', label: 'Installations générales, agencements, aménagements divers', class: '2', type: 'asset', parentCode: '218' },
  { code: '2182', label: 'Matériel de transport', class: '2', type: 'asset', parentCode: '218' },
  { code: '2183', label: 'Matériel de bureau et informatique', class: '2', type: 'asset', parentCode: '218' },
  { code: '2184', label: 'Mobilier', class: '2', type: 'asset', parentCode: '218' },
  { code: '23', label: 'IMMOBILISATIONS EN COURS', class: '2', type: 'asset' },
  { code: '27', label: 'AUTRES IMMOBILISATIONS FINANCIÈRES', class: '2', type: 'asset' },
  { code: '275', label: 'Dépôts et cautionnements versés', class: '2', type: 'asset', parentCode: '27' },
  { code: '28', label: 'AMORTISSEMENTS', class: '2', type: 'asset' },
  { code: '280', label: 'Amortissements des immobilisations incorporelles', class: '2', type: 'asset', parentCode: '28' },
  { code: '281', label: 'Amortissements des immobilisations corporelles', class: '2', type: 'asset', parentCode: '28' },
  { code: '2812', label: 'Amortissements des constructions', class: '2', type: 'asset', parentCode: '281' },
  { code: '2815', label: 'Amortissements du matériel médical et technique', class: '2', type: 'asset', parentCode: '281' },
  { code: '2818', label: 'Amortissements des autres immobilisations', class: '2', type: 'asset', parentCode: '281' },
  { code: '29', label: 'PROVISIONS POUR DÉPRÉCIATION DES IMMOBILISATIONS', class: '2', type: 'asset' },

  // ================= Classe 3: Comptes de stocks =================
  { code: '31', label: 'MATIÈRES PREMIÈRES', class: '3', type: 'asset' },
  { code: '32', label: 'AUTRES APPROVISIONNEMENTS', class: '3', type: 'asset' },
  { code: '35', label: 'STOCKS DE PRODUITS', class: '3', type: 'asset' },
  { code: '37', label: 'STOCKS DE MARCHANDISES', class: '3', type: 'asset' },
  { code: '371', label: 'Médicaments et produits pharmaceutiques', class: '3', type: 'asset', parentCode: '37' },
  { code: '39', label: 'PROVISIONS POUR DÉPRÉCIATION DES STOCKS', class: '3', type: 'asset' },

  // ================= Classe 4: Comptes de tiers =================
  { code: '40', label: 'FOURNISSEURS ET COMPTES RATTACHÉS', class: '4', type: 'liability' },
  { code: '401', label: 'Fournisseurs', class: '4', type: 'liability', parentCode: '40' },
  { code: '403', label: 'Fournisseurs, effets à payer', class: '4', type: 'liability', parentCode: '40' },
  { code: '404', label: "Fournisseurs d'immobilisations", class: '4', type: 'liability', parentCode: '40' },
  { code: '408', label: 'Fournisseurs, factures non parvenues', class: '4', type: 'liability', parentCode: '40' },
  { code: '41', label: 'CLIENTS ET COMPTES RATTACHÉS', class: '4', type: 'asset' },
  { code: '411', label: 'Clients', class: '4', type: 'asset', parentCode: '41' },
  { code: '413', label: 'Clients, effets à recevoir', class: '4', type: 'asset', parentCode: '41' },
  { code: '416', label: 'Clients douteux ou litigieux', class: '4', type: 'asset', parentCode: '41' },
  { code: '418', label: 'Clients, factures à établir', class: '4', type: 'asset', parentCode: '41' },
  { code: '42', label: 'PERSONNEL ET COMPTES RATTACHÉS', class: '4', type: 'liability' },
  { code: '421', label: 'Personnel, rémunérations dues', class: '4', type: 'liability', parentCode: '42' },
  { code: '425', label: 'Personnel, avances et acomptes', class: '4', type: 'asset', parentCode: '42' },
  { code: '428', label: 'Personnel, charges à payer', class: '4', type: 'liability', parentCode: '42' },
  { code: '43', label: 'SÉCURITÉ SOCIALE ET AUTRES ORGANISMES SOCIAUX', class: '4', type: 'liability' },
  { code: '431', label: 'Sécurité sociale', class: '4', type: 'liability', parentCode: '43' },
  { code: '437', label: 'Autres organismes sociaux', class: '4', type: 'liability', parentCode: '43' },
  { code: '44', label: 'ÉTAT ET AUTRES COLLECTIVITÉS PUBLIQUES', class: '4', type: 'liability' },
  { code: '441', label: 'État, subventions à recevoir', class: '4', type: 'asset', parentCode: '44' },
  { code: '444', label: 'État, impôts sur les bénéfices', class: '4', type: 'liability', parentCode: '44' },
  { code: '445', label: 'État, TVA', class: '4', type: 'liability', parentCode: '44' },
  { code: '4451', label: 'TVA déductible', class: '4', type: 'asset', parentCode: '445' },
  { code: '4455', label: 'TVA collectée', class: '4', type: 'liability', parentCode: '445' },
  { code: '4457', label: 'TVA à décaisser', class: '4', type: 'liability', parentCode: '445' },
  { code: '447', label: 'Autres impôts, taxes et versements assimilés', class: '4', type: 'liability', parentCode: '44' },
  { code: '448', label: 'État, charges à payer', class: '4', type: 'liability', parentCode: '44' },
  { code: '45', label: 'ORGANISMES DE PRÉVOYANCE ET INSTITUTIONS SOCIALES', class: '4', type: 'liability' },
  { code: '453', label: 'Organismes de prévoyance sociale', class: '4', type: 'liability', parentCode: '45' },
  { code: '46', label: 'DÉBITEURS DIVERS ET CRÉDITEURS DIVERS', class: '4', type: 'liability' },
  { code: '467', label: 'Autres débiteurs et créditeurs divers', class: '4', type: 'liability', parentCode: '46' },
  { code: '4672', label: "Compagnies d'assurance (créances)", class: '4', type: 'asset', parentCode: '467' },
  { code: '47', label: 'COMPTES TRANSITOIRES OU D\'ATTENTE', class: '4', type: 'asset' },
  { code: '48', label: 'COMPTES DE RÉGULARISATION', class: '4', type: 'asset' },
  { code: '481', label: 'Charges à répartir sur plusieurs exercices', class: '4', type: 'asset', parentCode: '48' },
  { code: '486', label: "Charges constatées d'avance", class: '4', type: 'asset', parentCode: '48' },
  { code: '487', label: "Produits constatés d'avance", class: '4', type: 'liability', parentCode: '48' },
  { code: '49', label: 'PROVISIONS POUR DÉPRÉCIATION DES COMPTES DE TIERS', class: '4', type: 'asset' },
  { code: '491', label: 'Provisions pour dépréciation des comptes clients', class: '4', type: 'asset', parentCode: '49' },

  // ================= Classe 5: Comptes de trésorerie =================
  { code: '50', label: 'VALEURS MOBILIÈRES DE PLACEMENT', class: '5', type: 'asset' },
  { code: '505', label: 'Actions', class: '5', type: 'asset', parentCode: '50' },
  { code: '506', label: 'Obligations', class: '5', type: 'asset', parentCode: '50' },
  { code: '51', label: 'BANQUES ET ÉTABLISSEMENTS FINANCIERS', class: '5', type: 'asset' },
  { code: '511', label: "Valeurs à l'encaissement", class: '5', type: 'asset', parentCode: '51' },
  { code: '512', label: 'Banque', class: '5', type: 'asset', parentCode: '51' },
  { code: '53', label: 'CAISSE', class: '5', type: 'asset' },
  { code: '531', label: 'Caisse principale', class: '5', type: 'asset', parentCode: '53' },
  { code: '532', label: 'Caisse mobile money', class: '5', type: 'asset', parentCode: '53' },
  { code: '54', label: "RÉGIES D'AVANCES ET ACCRÉDITIFS", class: '5', type: 'asset' },
  { code: '58', label: 'VIREMENTS INTERNES', class: '5', type: 'asset' },
  { code: '59', label: 'PROVISIONS POUR DÉPRÉCIATION DES COMPTES DE TRÉSORERIE', class: '5', type: 'asset' },

  // ================= Classe 6: Comptes de charges =================
  { code: '60', label: 'ACHATS', class: '6', type: 'expense' },
  { code: '600', label: 'Achats de matières premières et fournitures', class: '6', type: 'expense', parentCode: '60' },
  { code: '601', label: 'Achats de marchandises', class: '6', type: 'expense', parentCode: '60' },
  { code: '603', label: 'Variations des stocks', class: '6', type: 'expense', parentCode: '60' },
  { code: '604', label: 'Achats de produits médicaux', class: '6', type: 'expense', parentCode: '60' },
  { code: '606', label: 'Achats non stockés de matières et fournitures', class: '6', type: 'expense', parentCode: '60' },
  { code: '6061', label: 'Fournitures non stockables (eau, énergie, gaz)', class: '6', type: 'expense', parentCode: '606' },
  { code: '6063', label: "Fournitures d'entretien et de petit équipement", class: '6', type: 'expense', parentCode: '606' },
  { code: '6064', label: 'Fournitures administratives', class: '6', type: 'expense', parentCode: '606' },
  { code: '607', label: 'Achats de consommables', class: '6', type: 'expense', parentCode: '60' },
  { code: '61', label: 'SERVICES EXTÉRIEURS', class: '6', type: 'expense' },
  { code: '611', label: 'Sous-traitance générale', class: '6', type: 'expense', parentCode: '61' },
  { code: '612', label: 'Redevances de crédit-bail et locations', class: '6', type: 'expense', parentCode: '61' },
  { code: '613', label: 'Locations', class: '6', type: 'expense', parentCode: '61' },
  { code: '614', label: 'Charges locatives et de copropriété', class: '6', type: 'expense', parentCode: '61' },
  { code: '615', label: 'Entretien et réparations', class: '6', type: 'expense', parentCode: '61' },
  { code: '616', label: "Primes d'assurance", class: '6', type: 'expense', parentCode: '61' },
  { code: '617', label: 'Études et recherches', class: '6', type: 'expense', parentCode: '61' },
  { code: '618', label: 'Divers services extérieurs', class: '6', type: 'expense', parentCode: '61' },
  { code: '62', label: 'AUTRES SERVICES EXTÉRIEURS', class: '6', type: 'expense' },
  { code: '622', label: "Rémunérations d'intermédiaires et honoraires", class: '6', type: 'expense', parentCode: '62' },
  { code: '626', label: 'Frais postaux et de télécommunications', class: '6', type: 'expense', parentCode: '62' },
  { code: '627', label: 'Services bancaires et assimilés', class: '6', type: 'expense', parentCode: '62' },
  { code: '63', label: 'IMPÔTS, TAXES ET VERSEMENTS ASSIMILÉS', class: '6', type: 'expense' },
  { code: '631', label: 'Impôts, taxes et versements assimilés sur rémunérations (ISR)', class: '6', type: 'expense', parentCode: '63' },
  { code: '635', label: 'Autres impôts, taxes et versements assimilés', class: '6', type: 'expense', parentCode: '63' },
  { code: '64', label: 'CHARGES DE PERSONNEL', class: '6', type: 'expense' },
  { code: '641', label: 'Rémunérations du personnel', class: '6', type: 'expense', parentCode: '64' },
  { code: '645', label: 'Charges de sécurité sociale et de prévoyance', class: '6', type: 'expense', parentCode: '64' },
  { code: '65', label: 'AUTRES CHARGES DE GESTION COURANTE', class: '6', type: 'expense' },
  { code: '651', label: 'Pertes sur créances clients et autres débiteurs', class: '6', type: 'expense', parentCode: '65' },
  { code: '658', label: 'Charges diverses de gestion courante', class: '6', type: 'expense', parentCode: '65' },
  { code: '66', label: 'CHARGES FINANCIÈRES', class: '6', type: 'expense' },
  { code: '661', label: "Charges d'intérêts", class: '6', type: 'expense', parentCode: '66' },
  { code: '666', label: 'Pertes de change', class: '6', type: 'expense', parentCode: '66' },
  { code: '67', label: 'CHARGES EXCEPTIONNELLES', class: '6', type: 'expense' },
  { code: '671', label: 'Charges exceptionnelles sur opérations de gestion', class: '6', type: 'expense', parentCode: '67' },
  { code: '675', label: "Valeurs comptables des éléments d'actif cédés", class: '6', type: 'expense', parentCode: '67' },
  { code: '68', label: 'DOTATIONS AUX AMORTISSEMENTS ET AUX PROVISIONS', class: '6', type: 'expense' },
  { code: '681', label: 'Dotations aux amortissements et aux provisions (exploitation)', class: '6', type: 'expense', parentCode: '68' },
  { code: '69', label: 'IMPÔTS SUR LES BÉNÉFICES ET ASSIMILÉS', class: '6', type: 'expense' },
  { code: '695', label: 'Impôts sur les bénéfices (ISB)', class: '6', type: 'expense', parentCode: '69' },

  // ================= Classe 7: Comptes de produits =================
  { code: '70', label: 'VENTES DE PRODUITS FINIS, PRESTATIONS DE SERVICES, MARCHANDISES', class: '7', type: 'revenue' },
  { code: '701', label: 'Ventes de produits finis', class: '7', type: 'revenue', parentCode: '70' },
  { code: '706', label: 'Ventes de prestations de services', class: '7', type: 'revenue', parentCode: '70' },
  { code: '707', label: 'Ventes de marchandises', class: '7', type: 'revenue', parentCode: '70' },
  { code: '708', label: 'Produits des activités annexes', class: '7', type: 'revenue', parentCode: '70' },
  { code: '71', label: 'PRODUITS STOCKÉS', class: '7', type: 'revenue' },
  { code: '72', label: 'PRODUCTION IMMOBILISÉE', class: '7', type: 'revenue' },
  { code: '74', label: "SUBVENTIONS D'EXPLOITATION", class: '7', type: 'revenue' },
  { code: '75', label: 'AUTRES PRODUITS DE GESTION COURANTE', class: '7', type: 'revenue' },
  { code: '751', label: 'Revenus des créances commerciales', class: '7', type: 'revenue', parentCode: '75' },
  { code: '758', label: 'Produits divers de gestion courante', class: '7', type: 'revenue', parentCode: '75' },
  { code: '76', label: 'PRODUITS FINANCIERS', class: '7', type: 'revenue' },
  { code: '761', label: 'Produits de participations', class: '7', type: 'revenue', parentCode: '76' },
  { code: '765', label: 'Escomptes obtenus', class: '7', type: 'revenue', parentCode: '76' },
  { code: '766', label: 'Gains de change', class: '7', type: 'revenue', parentCode: '76' },
  { code: '77', label: 'PRODUITS EXCEPTIONNELS', class: '7', type: 'revenue' },
  { code: '771', label: 'Produits exceptionnels sur opérations de gestion', class: '7', type: 'revenue', parentCode: '77' },
  { code: '775', label: "Produits des cessions d'éléments d'actif", class: '7', type: 'revenue', parentCode: '77' },
  { code: '78', label: 'REPRISES SUR AMORTISSEMENTS ET PROVISIONS', class: '7', type: 'revenue' },
  { code: '781', label: 'Reprises sur amortissements et provisions (exploitation)', class: '7', type: 'revenue', parentCode: '78' },
  { code: '79', label: 'TRANSFERTS DE CHARGES', class: '7', type: 'revenue' },

  // ================= Classe 8: Comptes spéciaux (hors bilan) =================
  { code: '80', label: 'ENGAGEMENTS DONNÉS', class: '8', type: 'engagement' },
  { code: '81', label: 'ENGAGEMENTS REÇUS', class: '8', type: 'engagement' },
  { code: '89', label: 'SOLDE DES COMPTES SPÉCIAUX', class: '8', type: 'engagement' },
]

const mappingsData = [
  { eventType: 'pharmacy_sale', label: 'Vente pharmacie (espèces)', debitCode: '531', creditCode: '707' },
  { eventType: 'invoice_payment_cash', label: 'Paiement facture (espèces)', debitCode: '531', creditCode: '706' },
  { eventType: 'invoice_payment_mobile_money', label: 'Paiement facture (mobile money)', debitCode: '532', creditCode: '706' },
  { eventType: 'invoice_payment_card', label: 'Paiement facture (carte)', debitCode: '512', creditCode: '706' },
  { eventType: 'invoice_payment_transfer', label: 'Paiement facture (virement)', debitCode: '512', creditCode: '706' },
  { eventType: 'invoice_payment_check', label: 'Paiement facture (chèque)', debitCode: '512', creditCode: '706' },
  { eventType: 'invoice_payment_insurance', label: 'Paiement facture (assurance)', debitCode: '512', creditCode: '706' },
  { eventType: 'expense', label: 'Dépense (catégorie non définie)', debitCode: '658', creditCode: '531' },
  { eventType: 'expense:Consommables', label: 'Dépense: Consommables', debitCode: '607', creditCode: '531' },
  { eventType: 'expense:Maintenance', label: 'Dépense: Maintenance', debitCode: '615', creditCode: '531' },
  { eventType: 'expense:Services', label: 'Dépense: Services', debitCode: '618', creditCode: '531' },
  { eventType: 'expense:Médical', label: 'Dépense: Médical', debitCode: '604', creditCode: '531' },
  { eventType: 'expense:Utilities', label: 'Dépense: Utilities', debitCode: '6061', creditCode: '531' },
  { eventType: 'expense:Divers', label: 'Dépense: Divers', debitCode: '658', creditCode: '531' },
  { eventType: 'purchase_reception', label: "Réception d'achat (médicaments)", debitCode: '601', creditCode: '401' },
  { eventType: 'insurance_settlement', label: 'Règlement assurance', debitCode: '512', creditCode: '706' },
  { eventType: 'cash_session_surplus', label: 'Excédent de caisse', debitCode: '531', creditCode: '758' },
  { eventType: 'cash_session_deficit', label: 'Déficit de caisse', debitCode: '658', creditCode: '531' },
]

export async function seedAccounting() {
  console.log('📒 Upserting chart of accounts (plan comptable burundais)...')

  const accountIdByCode: Record<string, string> = {}
  let inserted = 0
  let updated = 0

  for (const a of accountsData) {
    const parentId = a.parentCode ? accountIdByCode[a.parentCode] : null

    const existing = await db.query.chartAccounts.findFirst({
      where: eq(chartAccounts.code, a.code),
    })

    if (existing) {
      await db.update(chartAccounts)
        .set({
          label: a.label,
          class: a.class,
          type: a.type,
          parentId,
          updatedAt: new Date(),
        })
        .where(eq(chartAccounts.id, existing.id))
      accountIdByCode[a.code] = existing.id
      updated++
    } else {
      const [account] = await db.insert(chartAccounts).values({
        code: a.code,
        label: a.label,
        class: a.class,
        type: a.type,
        parentId,
      }).returning()
      accountIdByCode[a.code] = account.id
      inserted++
    }
  }

  console.log(`  → ${inserted} comptes créés, ${updated} comptes mis à jour`)

  console.log('⚙️ Upserting accounting automation rules...')
  let mappingsUpdated = 0
  let mappingsInserted = 0
  for (const m of mappingsData) {
    const existing = await db.query.accountingMappings.findFirst({
      where: eq(accountingMappings.eventType, m.eventType),
    })
    if (existing) {
      await db.update(accountingMappings)
        .set({
          label: m.label,
          debitCode: m.debitCode,
          creditCode: m.creditCode,
          updatedAt: new Date(),
        })
        .where(eq(accountingMappings.id, existing.id))
      mappingsUpdated++
    } else {
      await db.insert(accountingMappings).values(m)
      mappingsInserted++
    }
  }
  console.log(`  → ${mappingsInserted} règles créées, ${mappingsUpdated} règles mises à jour`)

  const [count] = await db.select({ total: sql`count(*)` }).from(chartAccounts)
  console.log(`✅ Plan comptable complet (${count.total} comptes).`)
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  seedAccounting()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('❌ Seeding failed:', e)
      process.exit(1)
    })
}
