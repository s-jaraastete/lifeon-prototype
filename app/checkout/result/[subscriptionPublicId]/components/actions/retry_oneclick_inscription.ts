'use server';

import axiosServerManager from '@/lib/axios_server_manager';


const retryOneclickInscription = async (subscriptionPublicId: string): Promise<OneclickStartResponse> => {
  const response = await axiosServerManager(
    `/subscriptions/${subscriptionPublicId}/oneclick/inscription/start/`,
    {},
    {
      useAccessToken: false,
      method: 'post',
    }
  );

  return response as OneclickStartResponse;
};

export default retryOneclickInscription;