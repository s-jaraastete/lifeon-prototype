import axiosServerManager from '@/lib/axios_server_manager';
import CheckoutForm from './components/CheckoutForm';

const CheckoutPage = async () => {
  const response = await axiosServerManager('/regions/all/?page_size=20', null, {
    useAccessToken: false,
    method: 'get',
  });
  const regions: Region[] = response?.results ?? [];

  return (
    <div className="max-w-325 mx-auto py-12.5 px-4 lg:px-0">
      <h1 className="text-[40px] leading-12 font-semibold mb-8">Checkout</h1>

      <CheckoutForm regions={regions} />
    </div>
  );
};

export default CheckoutPage;
