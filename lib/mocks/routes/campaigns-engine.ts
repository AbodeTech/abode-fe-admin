import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';

const HAMPER_LEGACY_NAME = 'Hamper Campaign';
const PLOTS_LEGACY_NAME = '1000 Plots Project';

const STATUS_RANK: Record<CampaignStatus, number> = {
  active: 0,
  draft: 1,
  paused: 2,
  completed: 3,
};

const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString();

type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
type RewardType = 'ticket' | 'hamper';
type RewardRole = 'buyer' | 'referrer';

type StoreCampaign = {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  start_date: string;
  end_date: string;
  reward_type: RewardType;
  trigger_event: string;
  trigger_unit: string;
  trigger_mode: string;
  trigger_threshold: number;
  rewards_per_threshold: number;
  recipient_buyer: boolean;
  recipient_referrer: boolean;
  ticket_id_prefix: string | null;
  buyer_eligible_statuses: string[];
  referrer_eligible_statuses: string[];
  total_sqm_target: number | null;
  sqm_sold: number;
  reward_count: number;
  participant_count: number;
  checkpoints: {
    key: string;
    label: string;
    prize: string;
    sqm_required: number;
    prize_media_url?: string;
  }[];
  leaderboard_masking_enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type CampaignReward = {
  id: string;
  campaign_id: string;
  reward_type: RewardType;
  role: RewardRole;
  ticket_id: string | null;
  is_active: boolean;
  sqm_purchased: number;
  createdAt: string;
  invalidated_reason?: string | null;
  recipient: { id?: string; first_name: string; last_name: string; email?: string };
  source_buyer?: { id?: string; first_name: string; last_name: string } | null;
  asset: { id?: string; name: string };
};

const campaigns: StoreCampaign[] = [
  {
    id: '665fce0000000000000000h1',
    name: HAMPER_LEGACY_NAME,
    description: 'Hamper issuance for eligible land purchases.',
    status: 'active',
    start_date: iso(-90),
    end_date: iso(90),
    reward_type: 'hamper',
    trigger_event: 'asset_purchase',
    trigger_unit: 'sqm',
    trigger_mode: 'divisor',
    trigger_threshold: 500,
    rewards_per_threshold: 1,
    recipient_buyer: false,
    recipient_referrer: true,
    ticket_id_prefix: null,
    buyer_eligible_statuses: [],
    referrer_eligible_statuses: ['associate', 'associate-pro', 'founder'],
    total_sqm_target: 50_000,
    sqm_sold: 12_500,
    reward_count: 3,
    participant_count: 3,
    checkpoints: [
      { key: 'bronze', label: 'Bronze', prize: 'Branded hamper', sqm_required: 500 },
      { key: 'silver', label: 'Silver', prize: 'Weekend getaway', sqm_required: 1500 },
    ],
    leaderboard_masking_enabled: true,
    createdAt: iso(-90),
    updatedAt: iso(-1),
  },
  {
    id: '665fce0000000000000000p1',
    name: PLOTS_LEGACY_NAME,
    description: 'Ticket draw for the 1000 plots land-sales campaign.',
    status: 'active',
    start_date: iso(-120),
    end_date: iso(60),
    reward_type: 'ticket',
    trigger_event: 'asset_purchase',
    trigger_unit: 'sqm',
    trigger_mode: 'divisor',
    trigger_threshold: 300,
    rewards_per_threshold: 1,
    recipient_buyer: true,
    recipient_referrer: true,
    ticket_id_prefix: 'PLOT',
    buyer_eligible_statuses: ['user', 'associate', 'associate-pro'],
    referrer_eligible_statuses: ['associate', 'associate-pro', 'founder'],
    total_sqm_target: 100_000,
    sqm_sold: 41_200,
    reward_count: 4,
    participant_count: 3,
    checkpoints: [
      { key: 'starter', label: 'Starter', prize: 'Branded kit', sqm_required: 300 },
      { key: 'builder', label: 'Builder', prize: 'Generator', sqm_required: 1500 },
      { key: 'closer', label: 'Closer', prize: 'Car raffle entry', sqm_required: 5000 },
    ],
    leaderboard_masking_enabled: true,
    createdAt: iso(-120),
    updatedAt: iso(-2),
  },
  {
    id: '665fce0000000000000000d1',
    name: 'Founders Anniversary Draft',
    description: 'Draft campaign awaiting publish.',
    status: 'draft',
    start_date: iso(7),
    end_date: iso(97),
    reward_type: 'ticket',
    trigger_event: 'asset_purchase',
    trigger_unit: 'sqm',
    trigger_mode: 'divisor',
    trigger_threshold: 500,
    rewards_per_threshold: 1,
    recipient_buyer: true,
    recipient_referrer: true,
    ticket_id_prefix: 'ANN',
    buyer_eligible_statuses: ['user'],
    referrer_eligible_statuses: ['associate-pro'],
    total_sqm_target: 20_000,
    sqm_sold: 0,
    reward_count: 0,
    participant_count: 0,
    checkpoints: [],
    leaderboard_masking_enabled: true,
    createdAt: iso(-3),
    updatedAt: iso(-3),
  },
  {
    id: '665fce0000000000000000z1',
    name: 'Paused Flex Push',
    description: 'Issuance paused while rules are reviewed.',
    status: 'paused',
    start_date: iso(-30),
    end_date: iso(30),
    reward_type: 'ticket',
    trigger_event: 'asset_purchase',
    trigger_unit: 'sqm',
    trigger_mode: 'divisor',
    trigger_threshold: 250,
    rewards_per_threshold: 1,
    recipient_buyer: true,
    recipient_referrer: false,
    ticket_id_prefix: 'FLEX',
    buyer_eligible_statuses: ['user', 'associate'],
    referrer_eligible_statuses: [],
    total_sqm_target: null,
    sqm_sold: 1_800,
    reward_count: 2,
    participant_count: 2,
    checkpoints: [],
    leaderboard_masking_enabled: false,
    createdAt: iso(-40),
    updatedAt: iso(-5),
  },
  {
    id: '665fce0000000000000000c1',
    name: 'Completed Q1 Hamper',
    description: 'Ended. No further issuance.',
    status: 'completed',
    start_date: iso(-200),
    end_date: iso(-20),
    reward_type: 'hamper',
    trigger_event: 'asset_purchase',
    trigger_unit: 'sqm',
    trigger_mode: 'divisor',
    trigger_threshold: 1000,
    rewards_per_threshold: 1,
    recipient_buyer: true,
    recipient_referrer: true,
    ticket_id_prefix: null,
    buyer_eligible_statuses: ['user'],
    referrer_eligible_statuses: ['associate'],
    total_sqm_target: 10_000,
    sqm_sold: 10_000,
    reward_count: 1,
    participant_count: 1,
    checkpoints: [],
    leaderboard_masking_enabled: true,
    createdAt: iso(-200),
    updatedAt: iso(-20),
  },
];

const rewards: CampaignReward[] = [
  {
    id: '665frw0000000000000000r1',
    campaign_id: '665fce0000000000000000h1',
    reward_type: 'hamper',
    role: 'referrer',
    ticket_id: null,
    is_active: true,
    sqm_purchased: 1500,
    createdAt: iso(-20),
    recipient: { id: 'u1', first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com' },
    source_buyer: { id: 'u9', first_name: 'Ada', last_name: 'Obi' },
    asset: { id: 'a1', name: 'Adiva Plains' },
  },
  {
    id: '665frw0000000000000000r2',
    campaign_id: '665fce0000000000000000h1',
    reward_type: 'hamper',
    role: 'referrer',
    ticket_id: null,
    is_active: true,
    sqm_purchased: 500,
    createdAt: iso(-12),
    recipient: { id: 'u2', first_name: 'Ngozi', last_name: 'Adeleke', email: 'ngozi@example.com' },
    source_buyer: { id: 'u8', first_name: 'Tunde', last_name: 'Bakare' },
    asset: { id: 'a2', name: 'Aviation City' },
  },
  {
    id: '665frw0000000000000000r3',
    campaign_id: '665fce0000000000000000h1',
    reward_type: 'hamper',
    role: 'referrer',
    ticket_id: null,
    is_active: false,
    invalidated_reason: 'Issued against a reversed purchase.',
    sqm_purchased: 500,
    createdAt: iso(-8),
    recipient: { id: 'u3', first_name: 'Chika', last_name: 'Okeke', email: 'chika@example.com' },
    source_buyer: { id: 'u7', first_name: 'Ife', last_name: 'Nwosu' },
    asset: { id: 'a1', name: 'Adiva Plains' },
  },
  {
    id: '665frw0000000000000000t1',
    campaign_id: '665fce0000000000000000p1',
    reward_type: 'ticket',
    role: 'buyer',
    ticket_id: 'PLOT-1001',
    is_active: true,
    sqm_purchased: 300,
    createdAt: iso(-15),
    recipient: { id: 'u4', first_name: 'Bola', last_name: 'Ahmed', email: 'bola@example.com' },
    asset: { id: 'a3', name: 'Abijo GRA' },
  },
  {
    id: '665frw0000000000000000t2',
    campaign_id: '665fce0000000000000000p1',
    reward_type: 'ticket',
    role: 'referrer',
    ticket_id: 'PLOT-1002',
    is_active: true,
    sqm_purchased: 300,
    createdAt: iso(-15),
    recipient: { id: 'u5', first_name: 'Amina', last_name: 'Sule', email: 'amina@example.com' },
    source_buyer: { id: 'u4', first_name: 'Bola', last_name: 'Ahmed' },
    asset: { id: 'a3', name: 'Abijo GRA' },
  },
  {
    id: '665frw0000000000000000t3',
    campaign_id: '665fce0000000000000000p1',
    reward_type: 'ticket',
    role: 'buyer',
    ticket_id: 'PLOT-1003',
    is_active: false,
    invalidated_reason: 'Duplicate issuance after plan merge — reserved ticket id.',
    sqm_purchased: 600,
    createdAt: iso(-10),
    recipient: { id: 'u6', first_name: 'Emeka', last_name: 'Ike', email: 'emeka@example.com' },
    asset: { id: 'a2', name: 'Aviation City' },
  },
  {
    id: '665frw0000000000000000t4',
    campaign_id: '665fce0000000000000000p1',
    reward_type: 'ticket',
    role: 'buyer',
    ticket_id: 'PLOT-1004',
    is_active: true,
    sqm_purchased: 900,
    createdAt: iso(-4),
    recipient: { id: 'u4', first_name: 'Bola', last_name: 'Ahmed', email: 'bola@example.com' },
    asset: { id: 'a1', name: 'Adiva Plains' },
  },
  {
    id: '665frw0000000000000000z2',
    campaign_id: '665fce0000000000000000z1',
    reward_type: 'ticket',
    role: 'buyer',
    ticket_id: 'FLEX-0091',
    is_active: true,
    sqm_purchased: 250,
    createdAt: iso(-18),
    recipient: { id: 'u10', first_name: 'Kemi', last_name: 'Lawal', email: 'kemi@example.com' },
    asset: { id: 'a4', name: 'Lekki Gardens' },
  },
  {
    id: '665frw0000000000000000z3',
    campaign_id: '665fce0000000000000000z1',
    reward_type: 'ticket',
    role: 'buyer',
    ticket_id: 'FLEX-0092',
    is_active: true,
    sqm_purchased: 500,
    createdAt: iso(-6),
    recipient: { id: 'u11', first_name: 'Yusuf', last_name: 'Bello', email: 'yusuf@example.com' },
    asset: { id: 'a4', name: 'Lekki Gardens' },
  },
  {
    id: '665frw0000000000000000c2',
    campaign_id: '665fce0000000000000000c1',
    reward_type: 'hamper',
    role: 'buyer',
    ticket_id: null,
    is_active: true,
    sqm_purchased: 1000,
    createdAt: iso(-40),
    recipient: { id: 'u12', first_name: 'Fatima', last_name: 'Hassan', email: 'fatima@example.com' },
    asset: { id: 'a1', name: 'Adiva Plains' },
  },
];

function refreshCounts(campaign: StoreCampaign) {
  const rows = rewards.filter((row) => row.campaign_id === campaign.id);
  campaign.reward_count = rows.length;
  campaign.participant_count = new Set(rows.map((row) => row.recipient.email ?? row.recipient.first_name)).size;
  campaign.sqm_sold = rows.reduce((sum, row) => sum + (row.is_active ? row.sqm_purchased : 0), 0);
}

function findCampaign(id: string) {
  const campaign = campaigns.find((row) => row.id === id);
  if (!campaign) throw new MockHttpError(404, 'Campaign not found', 'CAMPAIGN_NOT_FOUND');
  return campaign;
}

function toApiCampaign(campaign: StoreCampaign) {
  return {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description ?? '',
    start_date: campaign.start_date,
    end_date: campaign.end_date,
    trigger_event: campaign.trigger_event,
    trigger_unit: campaign.trigger_unit,
    trigger_mode: campaign.trigger_mode,
    trigger_threshold: campaign.trigger_threshold,
    rewards_per_threshold: campaign.rewards_per_threshold,
    reward_type: campaign.reward_type,
    ticket_id_prefix: campaign.ticket_id_prefix,
    recipient_buyer: campaign.recipient_buyer,
    recipient_referrer: campaign.recipient_referrer,
    referrer_eligible_statuses: campaign.referrer_eligible_statuses,
    buyer_eligible_statuses: campaign.buyer_eligible_statuses,
    eligible_asset_types: [] as string[],
    total_sqm_target: campaign.total_sqm_target,
    checkpoints: campaign.checkpoints.map((checkpoint) => ({
      ...checkpoint,
      prize_media_url: checkpoint.prize_media_url ?? null,
    })),
    leaderboard_masking_enabled: campaign.leaderboard_masking_enabled,
    status: campaign.status,
    is_legacy: campaign.name === HAMPER_LEGACY_NAME || campaign.name === PLOTS_LEGACY_NAME,
    completed_at: campaign.status === 'completed' ? campaign.updatedAt : null,
    created_at: campaign.createdAt,
    updated_at: campaign.updatedAt,
  };
}

function toApiReward(row: CampaignReward) {
  return {
    id: row.id,
    campaign_id: row.campaign_id,
    recipient: {
      id: row.recipient.id ?? row.id,
      first_name: row.recipient.first_name,
      last_name: row.recipient.last_name,
      email: row.recipient.email ?? null,
    },
    role: row.role,
    reward_type: row.reward_type,
    ticket_id: row.ticket_id,
    source_buyer: row.source_buyer
      ? {
          id: row.source_buyer.id ?? '',
          first_name: row.source_buyer.first_name,
          last_name: row.source_buyer.last_name,
          email: null as string | null,
        }
      : null,
    source_payment_plan_id: null as string | null,
    asset_id: row.asset.id ?? '',
    asset_name: row.asset.name,
    sqm_purchased: row.sqm_purchased,
    reward_index_in_batch: 1,
    batch_size: 1,
    is_legacy: false,
    is_active: row.is_active,
    invalidated_at: row.is_active ? null : row.createdAt,
    invalidation_reason: row.invalidated_reason ?? null,
    created_at: row.createdAt,
  };
}

const DAY_MS = 86_400_000;

type PurchaseParty = { id: string; name: string; email: string };

type StorePurchase = {
  plan_id: string;
  purchased_at: string;
  buyer: PurchaseParty;
  referrer: PurchaseParty | null;
  asset_id: string;
  asset_name: string;
  asset_type: string;
  size_sqm: number;
  units: number;
  asset_price: number;
  amount_paid: number;
  balance: number;
  status: 'active' | 'overdue' | 'completed' | 'cancelled';
  is_defaulted: boolean;
  months: number;
  next_payment_date: string | null;
  buyer_tickets: string[];
  buyer_rewards: number;
  referrer_tickets: string[];
  referrer_rewards: number;
};

const MOCK_ASSETS = [
  { id: '665fa00000000000000000a1', name: 'Oasis Gardens, Epe', type: 'flex', price_per_sqm: 5_500 },
  { id: '665fa00000000000000000a2', name: 'Palm Springs, Ibeju-Lekki', type: 'flex', price_per_sqm: 7_200 },
  { id: '665fa00000000000000000a3', name: 'Crest View, Abuja', type: 'full-ownership', price_per_sqm: 9_800 },
  { id: '665fa00000000000000000a4', name: 'Green Acres, Ogun', type: 'flex', price_per_sqm: 3_900 },
  { id: '665fa00000000000000000a5', name: 'Harbour Point, Lekki', type: 'commercial', price_per_sqm: 14_000 },
];
const FIRST_NAMES = ['Ngozi', 'Tunde', 'Amaka', 'Chidi', 'Funke', 'Emeka', 'Aisha', 'Segun', 'Bola', 'Ifeoma', 'Kunle', 'Zainab'];
const LAST_NAMES = ['Adeola', 'Bello', 'Okafor', 'Eze', 'Balogun', 'Nwosu', 'Ibrahim', 'Adeyemi', 'Okonkwo', 'Lawal'];
const PLOT_SIZES = [150, 300, 300, 450, 500, 500, 600, 1000];

/** FNV-1a — a stable seed per campaign, so mock numbers survive a reload. */
function hashSeed(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32 — tiny deterministic PRNG. */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const purchaseCache = new Map<string, StorePurchase[]>();

/**
 * Every purchase in the campaign window, rewarded or not — the mock twin of
 * the BE's plan-backed land figure. Rewards per purchase follow the engine's
 * divisor rule, so a purchase below the threshold shows zero.
 */
function purchasesFor(campaign: StoreCampaign): StorePurchase[] {
  const cached = purchaseCache.get(campaign.id);
  if (cached) return cached;

  const seed = hashSeed(campaign.id);
  const rand = seededRandom(seed);
  const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)];
  const start = new Date(campaign.start_date).getTime();
  const until = Math.min(Date.now(), new Date(campaign.end_date).getTime());
  const days = Math.max(0, Math.floor((until - start) / DAY_MS));
  const count = Math.min(150, Math.round(days * 0.7));
  const party = (kind: string, index: number): PurchaseParty => {
    const first = FIRST_NAMES[index % FIRST_NAMES.length];
    const last = LAST_NAMES[(index * 7 + (kind === 'r' ? 3 : 0)) % LAST_NAMES.length];
    return {
      id: `665fb${kind === 'r' ? '2' : '1'}${seed.toString(16).padStart(8, '0')}${index.toString(16).padStart(10, '0')}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${index}@example.com`.toLowerCase(),
    };
  };
  const tickets = (n: number) =>
    campaign.reward_type === 'ticket'
      ? Array.from({ length: n }, () => `${campaign.ticket_id_prefix ?? 'TKT'}${String(Math.floor(rand() * 1_000_000)).padStart(6, '0')}`)
      : [];

  const rows: StorePurchase[] = [];
  for (let index = 0; index < count; index += 1) {
    // Skewed towards the first assets, so the breakdown has a clear leader.
    const asset = MOCK_ASSETS[Math.floor(rand() ** 1.6 * MOCK_ASSETS.length)];
    const size = pick(PLOT_SIZES);
    const units = rand() < 0.7 ? 1 : rand() < 0.66 ? 2 : 3;
    const totalSqm = size * units;
    const price = totalSqm * asset.price_per_sqm;
    const outright = rand() < 0.25;
    const paid = outright ? price : Math.round(price * (0.1 + rand() * 0.75));
    const roll = rand();
    const status: StorePurchase['status'] =
      paid >= price ? 'completed' : roll < 0.04 ? 'cancelled' : roll < 0.14 ? 'overdue' : 'active';
    const purchasedAt = start + rand() * (until - start);
    const referrer = rand() < 0.7 ? party('r', Math.floor(rand() * 8)) : null;
    const perRecipient = Math.floor(totalSqm / campaign.trigger_threshold) * campaign.rewards_per_threshold;
    const buyerRewards = campaign.recipient_buyer ? perRecipient : 0;
    const referrerRewards = campaign.recipient_referrer && referrer ? perRecipient : 0;

    rows.push({
      plan_id: `665fc0${seed.toString(16).padStart(8, '0')}${index.toString(16).padStart(10, '0')}`,
      purchased_at: new Date(purchasedAt).toISOString(),
      buyer: party('b', Math.floor(rand() * 40)),
      referrer,
      asset_id: asset.id,
      asset_name: asset.name,
      asset_type: asset.type,
      size_sqm: size,
      units,
      asset_price: price,
      amount_paid: paid,
      balance: price - paid,
      status,
      is_defaulted: status === 'overdue',
      months: outright ? 0 : pick([6, 12, 18, 24]),
      next_payment_date:
        status === 'active' || status === 'overdue'
          ? new Date(Date.now() + (status === 'overdue' ? -1 : 1) * Math.ceil(rand() * 28) * DAY_MS).toISOString()
          : null,
      buyer_rewards: buyerRewards,
      buyer_tickets: tickets(buyerRewards),
      referrer_rewards: referrerRewards,
      referrer_tickets: tickets(referrerRewards),
    });
  }

  rows.sort((a, b) => b.purchased_at.localeCompare(a.purchased_at));
  purchaseCache.set(campaign.id, rows);
  return rows;
}

const sqmOf = (row: StorePurchase) => row.size_sqm * row.units;
const OUTSTANDING_EXCLUDED = new Set(['suspended', 'completed', 'cancelled']);

function moneyOf(rows: StorePurchase[]) {
  return {
    purchases: rows.length,
    sqm_sold: rows.reduce((sum, row) => sum + sqmOf(row), 0),
    value_sold: rows.reduce((sum, row) => sum + row.asset_price, 0),
    amount_collected: rows.reduce((sum, row) => sum + row.amount_paid, 0),
    balance_outstanding: rows.reduce(
      (sum, row) => sum + (OUTSTANDING_EXCLUDED.has(row.status) ? 0 : row.balance),
      0
    ),
  };
}

function groupByAsset(rows: StorePurchase[]) {
  const groups = new Map<string, StorePurchase[]>();
  for (const row of rows) groups.set(row.asset_id, [...(groups.get(row.asset_id) ?? []), row]);
  return [...groups.values()];
}

function toApiPurchase(row: StorePurchase) {
  return {
    plan_id: row.plan_id,
    purchased_at: row.purchased_at,
    buyer: row.buyer,
    referrer: row.referrer,
    asset_id: row.asset_id,
    asset_name: row.asset_name,
    asset_type: row.asset_type,
    size_sqm: row.size_sqm,
    units: row.units,
    total_sqm: sqmOf(row),
    asset_price: row.asset_price,
    amount_paid: row.amount_paid,
    balance: row.balance,
    status: row.status,
    is_defaulted: row.is_defaulted,
    months: row.months,
    next_payment_date: row.next_payment_date,
    rewards: {
      buyer: { count: row.buyer_rewards, ticket_ids: row.buyer_tickets },
      referrer: { count: row.referrer_rewards, ticket_ids: row.referrer_tickets },
    },
  };
}

function dashboardFor(campaign: StoreCampaign) {
  const purchases = purchasesFor(campaign);
  const now = Date.now();
  const start = new Date(campaign.start_date).getTime();
  const end = new Date(campaign.end_date).getTime();
  const span = Math.max(0, end - start);
  const totalDays = Math.max(1, Math.ceil(span / DAY_MS));
  const elapsed = Math.min(Math.max(now - start, 0), span);
  const daysRemaining = Math.max(0, Math.ceil((end - now) / DAY_MS));
  const hasEnded = end < now;

  const sold = purchases.reduce((sum, row) => sum + sqmOf(row), 0);
  const target = campaign.total_sqm_target ?? null;
  const remaining = target ? Math.max(0, target - sold) : null;
  const daysLeft = Math.min(daysRemaining, totalDays);

  const invalidated = rewards.filter((row) => row.campaign_id === campaign.id && !row.is_active).length;
  const totalRewards = purchases.reduce((sum, row) => sum + row.buyer_rewards + row.referrer_rewards, 0);

  const days = new Map<string, { date: string; purchases: number; sqm_sold: number; rewards: number }>();
  for (let t = start; t <= Math.min(now, end); t += DAY_MS) {
    const date = new Date(t).toISOString().slice(0, 10);
    days.set(date, { date, purchases: 0, sqm_sold: 0, rewards: 0 });
  }
  for (const row of purchases) {
    const day = days.get(row.purchased_at.slice(0, 10));
    if (!day) continue;
    day.purchases += 1;
    day.sqm_sold += sqmOf(row);
    day.rewards += row.buyer_rewards + row.referrer_rewards;
  }

  const rank = (role: 'buyer' | 'referrer') => {
    const earners = new Map<string, { user_id: string; first_name: string; last_name: string; email: string; rewards: number; total_sqm: number }>();
    for (const row of purchases) {
      const person = role === 'buyer' ? row.buyer : row.referrer;
      const count = role === 'buyer' ? row.buyer_rewards : row.referrer_rewards;
      if (!person || count === 0) continue;
      const [first_name, ...rest] = person.name.split(' ');
      const current = earners.get(person.id) ?? {
        user_id: person.id,
        first_name,
        last_name: rest.join(' '),
        email: person.email,
        rewards: 0,
        total_sqm: 0,
      };
      current.rewards += count;
      current.total_sqm += sqmOf(row);
      earners.set(person.id, current);
    }
    return [...earners.values()]
      .sort((a, b) => b.rewards - a.rewards || b.total_sqm - a.total_sqm)
      .slice(0, 10);
  };
  const buyerRecipients = new Set(purchases.filter((row) => row.buyer_rewards > 0).map((row) => row.buyer.id));
  const referrerRecipients = new Set(
    purchases.filter((row) => row.referrer && row.referrer_rewards > 0).map((row) => row.referrer!.id)
  );

  const rewardedRows = purchases.filter((row) => row.buyer_rewards + row.referrer_rewards > 0);

  return {
    period: {
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      total_days: totalDays,
      days_elapsed: Math.min(totalDays, Math.floor(elapsed / DAY_MS)),
      days_remaining: daysRemaining,
      percent_elapsed: span > 0 ? elapsed / span : 1,
      has_started: now >= start,
      has_ended: hasEnded,
    },
    progress: {
      total_sqm_sold: sold,
      total_sqm_target: target,
      percent: target && target > 0 ? Math.min(1, sold / target) : null,
      sqm_remaining: remaining,
      daily_sqm_required: remaining === null || hasEnded || daysLeft === 0 ? null : remaining / daysLeft,
    },
    sales: {
      purchases: purchases.length,
      buyers: new Set(purchases.map((row) => row.buyer.id)).size,
      sqm_sold: sold,
    },
    assets: groupByAsset(purchases)
      .map((rows) => ({
        asset_id: rows[0].asset_id,
        asset_name: rows[0].asset_name,
        purchases: rows.length,
        sqm_sold: rows.reduce((sum, row) => sum + sqmOf(row), 0),
        share: sold > 0 ? rows.reduce((sum, row) => sum + sqmOf(row), 0) / sold : 0,
        rewards: rows.reduce((sum, row) => sum + row.buyer_rewards + row.referrer_rewards, 0),
      }))
      .sort((a, b) => b.sqm_sold - a.sqm_sold),
    participants: {
      total_recipients: new Set([...buyerRecipients, ...referrerRecipients]).size,
      buyer_recipients: buyerRecipients.size,
      referrer_recipients: referrerRecipients.size,
    },
    issuance: {
      total_rewards: totalRewards,
      active_rewards: Math.max(0, totalRewards - invalidated),
      invalidated_rewards: invalidated,
      total_sqm: rewardedRows.reduce((sum, row) => sum + sqmOf(row), 0),
      purchases: rewardedRows.length,
    },
    timeline: [...days.values()],
    top_earners: {
      buyers: rank('buyer'),
      referrers: rank('referrer'),
    },
  };
}

function revenueFor(campaign: StoreCampaign) {
  const purchases = purchasesFor(campaign);
  const totals = moneyOf(purchases);
  return {
    ...totals,
    avg_price_per_sqm: totals.sqm_sold > 0 ? totals.value_sold / totals.sqm_sold : null,
    collected_percent: totals.value_sold > 0 ? totals.amount_collected / totals.value_sold : null,
    assets: groupByAsset(purchases)
      .map((rows) => ({ asset_id: rows[0].asset_id, asset_name: rows[0].asset_name, ...moneyOf(rows) }))
      .sort((a, b) => b.value_sold - a.value_sold),
  };
}

function assertCheckpoints(checkpoints: StoreCampaign['checkpoints'] | undefined) {
  if (!checkpoints?.length) return;
  const keys = checkpoints.map((row) => row.key);
  if (new Set(keys).size !== keys.length) {
    throw new MockHttpError(400, 'Checkpoint keys must be unique', 'CHECKPOINT_ORDER_INVALID');
  }
  for (let index = 1; index < checkpoints.length; index += 1) {
    if (!(checkpoints[index].sqm_required > checkpoints[index - 1].sqm_required)) {
      throw new MockHttpError(
        400,
        'Checkpoint sqm_required must be strictly ascending',
        'CHECKPOINT_ORDER_INVALID'
      );
    }
  }
}

let createCounter = 0;

function allowedTransition(from: CampaignStatus, to: CampaignStatus) {
  if (to === 'completed') return from === 'active' || from === 'paused';
  if (from === 'draft' && to === 'active') return true;
  if (from === 'active' && to === 'paused') return true;
  if (from === 'paused' && to === 'active') return true;
  return false;
}

export const campaignEngineRoutes: MockRoutes = {
  'GET /admin/campaigns': ({ query }) => {
    const status = typeof query.status === 'string' ? query.status : '';
    const search = typeof query.search === 'string' ? query.search.toLowerCase() : '';
    let rows = campaigns.filter((campaign) => {
      if (status && campaign.status !== status) return false;
      if (search && !campaign.name.toLowerCase().includes(search)) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.name.localeCompare(b.name));
    return paged(rows.map(toApiCampaign), query, 20);
  },

  'POST /admin/campaigns': ({ body: raw }) => {
    const dto = body<Partial<StoreCampaign>>(raw);
    assertCheckpoints(dto.checkpoints);
    createCounter += 1;
    const created: StoreCampaign = {
      id: `665fce00000000000000n${String(createCounter).padStart(2, '0')}`,
      name: dto.name ?? 'Untitled',
      description: dto.description ?? '',
      status: 'draft',
      start_date: dto.start_date ?? iso(0),
      end_date: dto.end_date ?? iso(30),
      reward_type: dto.reward_type === 'hamper' ? 'hamper' : 'ticket',
      trigger_event: 'asset_purchase',
      trigger_unit: 'sqm',
      trigger_mode: 'divisor',
      trigger_threshold: Number(dto.trigger_threshold ?? 500),
      rewards_per_threshold: Number(dto.rewards_per_threshold ?? 1),
      recipient_buyer: dto.recipient_buyer !== false,
      recipient_referrer: dto.recipient_referrer !== false,
      ticket_id_prefix: dto.ticket_id_prefix ?? null,
      buyer_eligible_statuses: dto.buyer_eligible_statuses ?? [],
      referrer_eligible_statuses: dto.referrer_eligible_statuses ?? [],
      total_sqm_target: dto.total_sqm_target ?? null,
      sqm_sold: 0,
      reward_count: 0,
      participant_count: 0,
      checkpoints: dto.checkpoints ?? [],
      leaderboard_masking_enabled: dto.leaderboard_masking_enabled !== false,
      createdAt: iso(0),
      updatedAt: iso(0),
    };
    campaigns.unshift(created);
    return toApiCampaign(created);
  },

  'GET /admin/campaigns/:id': ({ params }) => {
    const campaign = findCampaign(params.id);
    return { ...toApiCampaign(campaign), reward_count: campaign.reward_count };
  },

  'PATCH /admin/campaigns/:id': ({ params, body: raw }) => {
    const campaign = findCampaign(params.id);
    const dto = body<Partial<StoreCampaign>>(raw);
    if (campaign.status === 'draft') {
      if (dto.checkpoints) assertCheckpoints(dto.checkpoints);
      Object.assign(campaign, dto, { updatedAt: iso(0) });
    } else {
      if (dto.checkpoints !== undefined) {
        throw new MockHttpError(
          400,
          'Checkpoints cannot be changed after a campaign is published',
          'CAMPAIGN_LOCKED_FIELD'
        );
      }
      if (dto.description !== undefined) campaign.description = dto.description;
      if (dto.total_sqm_target !== undefined) campaign.total_sqm_target = dto.total_sqm_target;
      if (dto.leaderboard_masking_enabled !== undefined) {
        campaign.leaderboard_masking_enabled = dto.leaderboard_masking_enabled;
      }
      campaign.updatedAt = iso(0);
    }
    return toApiCampaign(campaign);
  },

  'POST /admin/campaigns/:id/transition': ({ params, body: raw }) => {
    const campaign = findCampaign(params.id);
    const dto = body<{ status?: CampaignStatus; new_status?: CampaignStatus }>(raw);
    const next = dto.status ?? dto.new_status;
    if (!next || !allowedTransition(campaign.status, next)) {
      throw new MockHttpError(400, 'Invalid campaign transition', 'INVALID_TRANSITION');
    }
    campaign.status = next;
    campaign.updatedAt = iso(0);
    return toApiCampaign(campaign);
  },

  'GET /admin/campaigns/:id/dashboard': ({ params }) => dashboardFor(findCampaign(params.id)),

  'GET /admin/campaigns/:id/revenue': ({ params }) => revenueFor(findCampaign(params.id)),

  'GET /admin/campaigns/:id/purchases': ({ params, query }) => {
    const search = typeof query.search === 'string' ? query.search.toLowerCase() : '';
    const assetId = typeof query.asset_id === 'string' ? query.asset_id : '';
    const rows = purchasesFor(findCampaign(params.id)).filter((row) => {
      if (assetId && row.asset_id !== assetId) return false;
      if (!search) return true;
      return [row.buyer.name, row.buyer.email, row.referrer?.name ?? '', row.asset_name]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
    return paged(rows.map(toApiPurchase), query, 20);
  },

  'GET /admin/campaigns/:id/rewards': ({ params, query }) => {
    findCampaign(params.id);
    const search = typeof query.search === 'string' ? query.search.toLowerCase() : '';
    const role = typeof query.role === 'string' ? query.role : '';
    const isActiveRaw = query.is_active;
    let rows = rewards.filter((row) => row.campaign_id === params.id);
    if (role) rows = rows.filter((row) => row.role === role);
    if (isActiveRaw === 'true') rows = rows.filter((row) => row.is_active);
    if (isActiveRaw === 'false') rows = rows.filter((row) => !row.is_active);
    if (search) {
      rows = rows.filter((row) => {
        const name = `${row.recipient.first_name} ${row.recipient.last_name}`.toLowerCase();
        return (
          name.includes(search) ||
          (row.recipient.email ?? '').toLowerCase().includes(search) ||
          (row.ticket_id ?? '').toLowerCase().includes(search)
        );
      });
    }
    return paged(rows.map(toApiReward), query, 20);
  },

  'GET /admin/campaigns/:id/rewards/export': ({ params, query }) => {
    const listed = campaignEngineRoutes['GET /admin/campaigns/:id/rewards']({
      params,
      query: { ...query, page: 1, limit: 10_000 },
      body: undefined,
    }) as { data: ReturnType<typeof toApiReward>[] };
    const header = 'recipient,role,ticket_id,asset,sqm,issued,status';
    const lines = listed.data.map((row) =>
      [
        `${row.recipient.first_name ?? ''} ${row.recipient.last_name ?? ''}`.trim(),
        row.role,
        row.ticket_id ?? '',
        row.asset_name,
        row.sqm_purchased,
        row.created_at,
        row.is_active ? 'active' : 'invalidated',
      ].join(',')
    );
    return [header, ...lines].join('\n');
  },

  'POST /admin/campaigns/rewards/:id/invalidate': ({ params, body: raw }) => {
    const reward = rewards.find((row) => row.id === params.id);
    if (!reward) throw new MockHttpError(404, 'Reward not found', 'REWARD_NOT_FOUND');
    const dto = body<{ reason?: string }>(raw);
    if (!dto.reason || dto.reason.length < 20) {
      throw new MockHttpError(400, 'Reason must be at least 20 characters', 'INVALID_REASON');
    }
    reward.is_active = false;
    reward.invalidated_reason = dto.reason;
    const campaign = campaigns.find((row) => row.id === reward.campaign_id);
    if (campaign) refreshCounts(campaign);
    return toApiReward(reward);
  },

  'GET /admin/campaigns/rewards/:id/ticket.pdf': ({ params }) => {
    const reward = rewards.find((row) => row.id === params.id);
    if (!reward) throw new MockHttpError(404, 'Reward not found', 'REWARD_NOT_FOUND');
    if (!reward.ticket_id) throw new MockHttpError(400, 'PDF not applicable for hampers', 'PDF_NOT_APPLICABLE');
    return `%PDF-1.1 mock ticket ${reward.ticket_id}`;
  },
};
