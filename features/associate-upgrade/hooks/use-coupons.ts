import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

const GET_ACTIVE_COUPONS = graphql(`
  query GetActiveCoupons {
    getActiveCoupons {
      data {
        _id
        couponCode
        discountPercentage
        startDate
        endDate
        expiryDate
        expiryType
        usageLimit
        usageLimitType
        status
        activeImmediately
        createdAt
        updatedAt
      }
      count
    }
  }
`);

const CREATE_COUPON = graphql(`
  mutation CreateCoupon($input: CreateCouponInput!) {
    createCoupon(createCouponInput: $input) {
      success
      message
      data {
        _id
      }
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
  endDate?: Date;
  usageLimitType: string;
  usageLimit?: number;
  activeImmediately: boolean;
}

interface UpdateCouponPayload {
  couponCode: string;
  discountPercentage?: number;
  expiryType?: string;
  expiryDate?: Date;
  startDate?: Date;
  endDate?: Date;
  usageLimitType?: string;
  usageLimit?: number;
}

export const useCoupons = () => {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: () => execute(GET_ACTIVE_COUPONS),
    select: (data) => data.getActiveCoupons,
  });
};

export const useCreateCoupon = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCouponPayload) => execute(CREATE_COUPON, { input }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
};

export const useUpdateCoupon = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCouponPayload) => execute(CREATE_OR_UPDATE_COUPON, { input }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
};

export const useUpdateCouponStatus = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { couponCode: string; status: string }) =>
      execute(UPDATE_COUPON_STATUS, { input }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
};

export const useDeleteCoupon = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (couponCode: string) => execute(DELETE_COUPON, { couponCode }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
};

const CREATE_OR_UPDATE_COUPON = graphql(`
  mutation UpdateCoupon($input: UpdateCouponInput!) {
    updateCoupon(updateCouponInput: $input) {
      message
      success
      data {
        _id
      }
    }
  }
`);
