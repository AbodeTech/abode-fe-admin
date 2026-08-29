/* ============================================================
 * People the REST mocks share.
 *
 * One person per id across every mock domain, so a name doesn't change identity
 * between the upgrade queue, the user picker and the commission overrides.
 * `c1` and `c2` match the names commission.ts already uses for those ids.
 *
 * The shape is what the BE's `.populate()` resolves a user ref to. Routes that
 * populate spread these in; routes that don't return the bare id.
 * ============================================================ */

export type MockPerson = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  phoneNumber: string;
  referral_status: string;
  /** Absent means the manual-upgrade fee path fails, as it does on the BE. */
  wallet?: string;
  /**
   * The KYC TIN artifact (ticket 23). Deliberately varied across the fixtures —
   * approved, awaiting review, rejected and absent — so the withdrawal queue's
   * "don't present an unchecked number as fact" path is exercised rather than
   * every row looking verified.
   */
  tin?: { value: string; state: 'not_started' | 'pending' | 'approved' | 'rejected' };
};

export const PEOPLE: MockPerson[] = [
  {
    _id: '665fcccc00000000000000c1',
    firstName: 'John',
    lastName: 'Okafor',
    email: 'john.okafor@example.com',
    userName: 'johnokafor',
    phoneNumber: '+2348011111111',
    referral_status: 'associate-pro',
    wallet: '665fdddd000000000000wa01',
    tin: { value: '12345678-0001', state: 'approved' },
  },
  {
    _id: '665fcccc00000000000000c2',
    firstName: 'Uche',
    lastName: 'Eze',
    email: 'uche.eze@example.com',
    userName: 'ucheeze',
    phoneNumber: '+2348022222222',
    referral_status: 'premium',
    wallet: '665fdddd000000000000wa02',
    tin: { value: '12345678-0002', state: 'pending' },
  },
  {
    _id: '665fcccc00000000000000c3',
    firstName: 'Funke',
    lastName: 'Adebayo',
    email: 'funke.adebayo@example.com',
    userName: 'funkeade',
    phoneNumber: '+2348033333333',
    referral_status: 'associate',
    wallet: '665fdddd000000000000wa03',
    tin: { value: '12345678-0003', state: 'approved' },
  },
  {
    _id: '665fcccc00000000000000c4',
    firstName: 'Ibrahim',
    lastName: 'Musa',
    email: 'ibrahim.musa@example.com',
    userName: 'ibrahimm',
    phoneNumber: '+2348044444444',
    referral_status: 'associate',
    wallet: '665fdddd000000000000wa04',
  },
  {
    _id: '665fcccc00000000000000c5',
    firstName: 'Ngozi',
    lastName: 'Nwosu',
    email: 'ngozi.nwosu@example.com',
    userName: 'ngozin',
    phoneNumber: '+2348055555555',
    referral_status: 'associate-pro',
    wallet: '665fdddd000000000000wa05',
  },
  {
    _id: '665fcccc00000000000000c6',
    firstName: 'Tunde',
    lastName: 'Balogun',
    email: 'tunde.balogun@example.com',
    userName: 'tundeb',
    phoneNumber: '+2348066666666',
    referral_status: 'associate',
    wallet: '665fdddd000000000000wa06',
  },
  {
    // The withdrawal queue's third requester; commission.ts names this id too.
    _id: '665fcccc00000000000000c9',
    firstName: 'Amaka',
    lastName: 'Obi',
    email: 'amaka.obi@example.com',
    userName: 'amakaobi',
    phoneNumber: '+2348099999999',
    referral_status: 'default',
    wallet: '665fdddd000000000000wa09',
    tin: { value: '12345678-0009', state: 'rejected' },
  },
  {
    // No wallet — exercises the manual-upgrade "User has no wallet" failure.
    _id: '665fcccc00000000000000c7',
    firstName: 'Zainab',
    lastName: 'Bello',
    email: 'zainab.bello@example.com',
    userName: 'zainabb',
    phoneNumber: '+2348077777777',
    referral_status: 'user',
  },
];

const BY_ID = new Map(PEOPLE.map((person) => [person._id, person]));

export function findPerson(id: string | null | undefined): MockPerson | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/**
 * A person as an API response carries them — `wallet` is internal to the mock,
 * standing in for the BE field that decides whether a fee can be recorded.
 */
export function publicPerson(person: MockPerson) {
  return {
    _id: person._id,
    firstName: person.firstName,
    lastName: person.lastName,
    email: person.email,
    userName: person.userName,
    phoneNumber: person.phoneNumber,
    referral_status: person.referral_status,
  };
}

/**
 * Populate a ref with exactly the fields the BE's projection selects — no more.
 *
 * Being generous here would be the expensive kind of wrong: a column built
 * against a mock that supplies more than production does looks correct all the
 * way to deploy, then renders blank. Unknown ids stay bare, which is how a ref
 * to a deleted record behaves.
 */
function refWith(id: string | null | undefined, fields: readonly (keyof MockPerson)[]): unknown {
  if (!id) return null;
  const person = BY_ID.get(id);
  if (!person) return id;

  const ref: Record<string, unknown> = { _id: person._id };
  for (const field of fields) {
    if (field !== '_id' && field !== 'wallet') ref[field] = person[field];
  }
  return ref;
}

/** `.populate('user', 'firstName lastName email userName phoneNumber referral_status')` */
export function applicantRef(id: string | null | undefined): unknown {
  return refWith(id, ['firstName', 'lastName', 'email', 'userName', 'phoneNumber', 'referral_status']);
}

/**
 * `.populate('referrer', 'firstName lastName email userName phoneNumber')` —
 * the phone landed with ticket 22a, so this projection is now the applicant's
 * minus `referral_status`.
 */
export function referrerRef(id: string | null | undefined): unknown {
  return refWith(id, ['firstName', 'lastName', 'email', 'userName', 'phoneNumber']);
}

/** `.populate('reviewed_by', 'firstName lastName')` — an Admin, not a User. */
export const ADMIN_REVIEWER = {
  _id: '665fbbbb00000000000000bb',
  firstName: 'Tolu',
  lastName: 'Adeyemi',
};

export function adminRef(id: string | null | undefined): unknown {
  if (!id) return null;
  return id === ADMIN_REVIEWER._id ? ADMIN_REVIEWER : id;
}

/** The same regex-over-several-fields match `findUserIdsBySearch` performs. */
export function matchesPersonSearch(person: MockPerson, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;

  return [person.firstName, person.lastName, person.email, person.userName].some((field) =>
    field.toLowerCase().includes(needle)
  );
}
