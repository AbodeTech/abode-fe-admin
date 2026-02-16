import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

import { CouponRowFragment } from '../components/coupons/CouponsTable';

const GET_ALL_COUPONS = graphql(`
  query GetAllCoupons {
    getAllCoupons {
      data {
        ...CouponRowFragment
      }
      count
    }
  }
`);

const CREATE_COUPON = graphql(`
  mutation CreateCoupon($input: CreateCouponInput!) {
    createCoupon(createCouponInput: $input) {
      _id
    }
  }
`);

const UPDATE_COUPON_STATUS = graphql(`
  mutation UpdateCouponStatus($input: UpdateCouponStatusInput!) {
    updateCouponStatus(updateCouponStatusInput: $input) {
      message
      success
    }
  }
`);

const DELETE_COUPON = graphql(`
  mutation DeleteCoupon($couponCode: String!) {
    deleteCoupon(couponCode: $couponCode) {
      message
      success
    }
  }
`);

interface CreateCouponPayload {
  couponCode: string;
  discountPercentage: number;
  expiryType: string;
  expiryDate?: Date;
  startDate?: Date;
  usageLimitType: string;
  usageLimit?: number;
  activeImmediately: boolean;
}

export const useCoupons = () => {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: () => execute(GET_ALL_COUPONS as any, {}),
    select: (data: any) => data.getAllCoupons,
  });
};

export const useCreateCoupon = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCouponPayload) => execute(CREATE_COUPON as any, { input }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
};

export const useUpdateCouponStatus = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { couponCode: string; status: string }) =>
      execute(UPDATE_COUPON_STATUS as any, { input }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
};

export const useDeleteCoupon = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (couponCode: string) => execute(DELETE_COUPON as any, { couponCode }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
};
