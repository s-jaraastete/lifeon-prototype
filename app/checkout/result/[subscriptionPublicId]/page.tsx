import CheckoutResult from './components/CheckoutResult';
import { getServerData } from '@/lib/requests';


interface CheckoutResultPageProps {
  params: Promise<{
    subscriptionPublicId: string;
  }>;
}

const CheckoutResultPage = async ({ params }: CheckoutResultPageProps) => {
  const { subscriptionPublicId } = await params;

  const { data: result } = await getServerData(`/subscriptions/${subscriptionPublicId}/checkout-result/`, 
    {
      useAccessToken: false,
      cache: 'no-store',
    }) as { data: CheckoutResultData }

  return <CheckoutResult result={result} />;
};

export default CheckoutResultPage;