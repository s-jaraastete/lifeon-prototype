'use server';

import axiosServerManager from '@/lib/axios_server_manager';


const retryInitialPayment = async (subscriptionPublicId: string): Promise<RetryInitialPaymentResponse> => {
  const response = await axiosServerManager(
    `/subscriptions/${subscriptionPublicId}/payments/initial/`,
    {},
    {
      useAccessToken: false,
      method: 'post',
    }
  );

  return response as RetryInitialPaymentResponse;
};

export default retryInitialPayment;