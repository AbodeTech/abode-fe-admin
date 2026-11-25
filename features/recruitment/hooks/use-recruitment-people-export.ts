'use client';

import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { saveAs } from 'file-saver';
import { apiGetPaged } from '@/lib/api-client';
import { RecruitmentAnalysisPersonSchema, type RecruitmentAnalysisPerson, type RecruitmentFollowUp } from '../schemas/recruitment-analysis.schema';
import { followUpCsv } from '../utils/follow-up-csv';
import type { RecruitmentAnalysisFilters } from './use-recruitment';

type ExportSelection = {
  filters: RecruitmentAnalysisFilters;
  followUp: RecruitmentFollowUp;
  search: string;
  label: string;
  expectedTotal: number;
};

/** Fetch every matching page; never download a partial result as a complete list. */
export async function collectFollowUpPeople(selection: ExportSelection, signal: AbortSignal) {
  if (!selection.filters.cohort_id) throw new Error('Select a cohort before downloading a follow-up list.');
  const people: RecruitmentAnalysisPerson[] = [];
  const identities = new Set<string>();
  const limit = 100;
  let total = selection.expectedTotal;
  for (let page = 1; page === 1 || people.length < total; page += 1) {
    signal.throwIfAborted();
    const result = await apiGetPaged('/admin/academy/recruitment-analysis/people', RecruitmentAnalysisPersonSchema, {
      params: { ...selection.filters, follow_up: selection.followUp, search: selection.search || undefined, page, limit },
    });
    // The shared API helper has no AbortSignal option; cancel before further pages or saving.
    signal.throwIfAborted();
    if (!Number.isSafeInteger(result.meta.total) || result.meta.total! < 0 || result.meta.total !== total) {
      throw new Error('The follow-up list changed. Refresh the list and download again.');
    }
    total = result.meta.total!;
    if (result.items.length !== Math.min(limit, total - people.length)) {
      throw new Error('The full follow-up list could not be retrieved. Please refresh and try again.');
    }
    for (const person of result.items) {
      const identity = `${person.cohort_id}:${person.user_id}`;
      if (identities.has(identity) || person.cohort_id !== selection.filters.cohort_id || (selection.filters.source && person.source !== selection.filters.source)) {
        throw new Error('The follow-up results are inconsistent. No file was downloaded; refresh and try again.');
      }
      identities.add(identity);
      people.push(person);
    }
  }
  if (!people.length) throw new Error('No matching people to download.');
  return people;
}

export function useRecruitmentPeopleExport() {
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const mutation = useMutation({
    mutationFn: async (selection: ExportSelection) => {
      if (active.current) throw new Error('A download is already being prepared.');
      const controller = new AbortController();
      active.current = controller;
      try {
        const people = await collectFollowUpPeople(selection, controller.signal);
        controller.signal.throwIfAborted();
        const cohort = people[0].cohort_name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 70) || 'cohort';
        const filename = `${cohort}-${selection.followUp}-${new Date().toISOString().slice(0, 10)}.csv`;
        saveAs(new Blob([followUpCsv(people, selection.label)], { type: 'text/csv;charset=utf-8;' }), filename);
        return people.length;
      } finally {
        if (active.current === controller) active.current = null;
      }
    },
  });
  return { ...mutation, cancel: () => active.current?.abort() };
}
