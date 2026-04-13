/** Canonical test data used across all E2E specs. */

export interface Traveler {
  nationality: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameAr: string;
  lastNameAr: string;
  passportNumber: string;
  birthDate: string;
  passportExpiry: string;
  gender: 'Male' | 'Female';
}

/** Fixed agency used for stable login helpers. */
export const testAgency = {
  nameEn: 'Nile Travel Agency',
  nameAr: 'شركة النيل للسياحة والسفر',
  email: 'e2e-agency@niletravel.test',
  password: 'Test@1234',
  contactPersonName: 'محمد الحسيني',
  phone: '+201234567890',
  licenseNumber: 'LICE2E001',
};

/** Seeded super-admin account. */
export const testAdmin = {
  email: 'admin@scg.gov.eg',
  password: 'Admin@1234',
};

/** Ten realistic travelers from the 15 seeded nationalities. */
export const testTravelers: Traveler[] = [
  {
    nationality: 'IQ',
    firstNameEn: 'Omar',
    lastNameEn: 'Al-Rashidi',
    firstNameAr: 'عمر',
    lastNameAr: 'الرشيدي',
    passportNumber: 'A12345678',
    birthDate: '1990-05-15',
    passportExpiry: '2028-03-10',
    gender: 'Male',
  },
  {
    nationality: 'SY',
    firstNameEn: 'Ahmed',
    lastNameEn: 'Al-Masri',
    firstNameAr: 'أحمد',
    lastNameAr: 'المصري',
    passportNumber: 'S87654321',
    birthDate: '1985-08-20',
    passportExpiry: '2027-06-15',
    gender: 'Male',
  },
  {
    nationality: 'YE',
    firstNameEn: 'Fatima',
    lastNameEn: 'Al-Sanaani',
    firstNameAr: 'فاطمة',
    lastNameAr: 'الصنعاني',
    passportNumber: 'Y11223344',
    birthDate: '1995-02-28',
    passportExpiry: '2026-11-30',
    gender: 'Female',
  },
  {
    nationality: 'LY',
    firstNameEn: 'Khalid',
    lastNameEn: 'Benghazi',
    firstNameAr: 'خالد',
    lastNameAr: 'بنغازي',
    passportNumber: 'L44556677',
    birthDate: '1988-11-10',
    passportExpiry: '2029-01-20',
    gender: 'Male',
  },
  {
    nationality: 'SD',
    firstNameEn: 'Amira',
    lastNameEn: 'Hassan',
    firstNameAr: 'أميرة',
    lastNameAr: 'حسن',
    passportNumber: 'SD9988776',
    birthDate: '1993-07-04',
    passportExpiry: '2027-09-14',
    gender: 'Female',
  },
  {
    nationality: 'PK',
    firstNameEn: 'Muhammad',
    lastNameEn: 'Khan',
    firstNameAr: 'محمد',
    lastNameAr: 'خان',
    passportNumber: 'PK1234567',
    birthDate: '1987-03-22',
    passportExpiry: '2028-12-01',
    gender: 'Male',
  },
  {
    nationality: 'AF',
    firstNameEn: 'Ali',
    lastNameEn: 'Karimi',
    firstNameAr: 'علي',
    lastNameAr: 'كريمي',
    passportNumber: 'AF8765432',
    birthDate: '1991-09-09',
    passportExpiry: '2026-04-18',
    gender: 'Male',
  },
  {
    nationality: 'ET',
    firstNameEn: 'Dawit',
    lastNameEn: 'Tesfaye',
    firstNameAr: 'داويت',
    lastNameAr: 'تسفاي',
    passportNumber: 'ET3456789',
    birthDate: '1994-12-25',
    passportExpiry: '2029-07-07',
    gender: 'Male',
  },
  {
    nationality: 'NG',
    firstNameEn: 'Aisha',
    lastNameEn: 'Ibrahim',
    firstNameAr: 'عائشة',
    lastNameAr: 'إبراهيم',
    passportNumber: 'NG5544332',
    birthDate: '1996-06-18',
    passportExpiry: '2027-02-25',
    gender: 'Female',
  },
  {
    nationality: 'IR',
    firstNameEn: 'Reza',
    lastNameEn: 'Ahmadi',
    firstNameAr: 'رضا',
    lastNameAr: 'أحمدي',
    passportNumber: 'IR6677881',
    birthDate: '1989-01-30',
    passportExpiry: '2028-08-12',
    gender: 'Male',
  },
];
