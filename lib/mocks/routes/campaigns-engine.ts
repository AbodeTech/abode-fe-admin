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

function dashboardFor(campaign: StoreCampaign) {
  const rows = rewards.filter((row) => row.campaign_id === campaign.id);
  const active = rows.filter((row) => row.is_active);
  const byDate = new Map<string, { rewards: number; sqm: number }>();
  for (const row of rows) {
    const day = row.createdAt.slice(0, 10);
    const current = byDate.get(day) ?? { rewards: 0, sqm: 0 };
    current.rewards += 1;
    current.sqm += row.sqm_purchased;
    byDate.set(day, current);
  }

  const rank = (role: RewardRole) => {
    const earners = new Map<
      string,
      { user_id: string; first_name: string; last_name: string; email: string | null; rewards: number; total_sqm: number }
    >();
    for (const row of active.filter((item) => item.role === role)) {
      const id = row.recipient.id ?? row.recipient.email ?? row.recipient.first_name;
      const current = earners.get(id) ?? {
        user_id: id,
        first_name: row.recipient.first_name,
        last_name: row.recipient.last_name,
        email: row.recipient.email ?? null,
        rewards: 0,
        total_sqm: 0,
      };
      current.rewards += 1;
      current.total_sqm += row.sqm_purchased;
      earners.set(id, current);
    }
    return [...earners.values()].sort((a, b) => b.rewards - a.rewards).slice(0, 5);
  };

  const now = Date.now();
  const end = new Date(campaign.end_date).getTime();
  const target = campaign.total_sqm_target ?? null;
  const totalSqm = campaign.sqm_sold ?? 0;

  return {
    period: {
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      days_remaining: Math.max(0, Math.ceil((end - now) / 86_400_000)),
      has_ended: end < now,
    },
    progress: {
      total_sqm_sold: totalSqm,
      total_sqm_target: target,
      percent: target && target > 0 ? Math.min(1, totalSqm / target) : null,
    },
    participants: {
      total_recipients: campaign.participant_count,
      buyer_recipients: new Set(active.filter((row) => row.role === 'buyer').map((row) => row.recipient.email)).size,
      referrer_recipients: new Set(
        active.filter((row) => row.role === 'referrer').map((row) => row.recipient.email)
      ).size,
    },
    issuance: {
      total_rewards: rows.length,
      active_rewards: active.length,
      invalidated_rewards: rows.length - active.length,
      total_sqm: totalSqm,
      purchases: new Set(active.map((row) => `${row.asset.name}-${row.sqm_purchased}`)).size,
    },
    timeline: [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({ date, ...stats })),
    top_earners: {
      buyers: rank('buyer'),
      referrers: rank('referrer'),
    },
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
  if (to === 'completed') return from !== 'completed';
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
