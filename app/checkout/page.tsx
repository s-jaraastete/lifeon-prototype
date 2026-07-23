import Link from 'next/link';
import { LuChevronLeft } from 'react-icons/lu';
import getUF from '@/utils/getUF';
import axiosServerManager from '@/lib/axios_server_manager';
import CheckoutForm from './components/CheckoutForm';
import OneclickInscriptionButton from './components/OneclickInscriptionButton';


const CheckoutPage = async () => {
  const ufInfo = await getUF()
  // TODO: Cambiar a getServerData
  const response = await axiosServerManager('/regions/all/?page_size=20', null, {
    useAccessToken: false,
    method: 'get',
  });
  const regions: Region[] = response?.results ?? [];

  return (
    <div className="max-w-325 mx-auto py-8 lg:py-12.5 px-4 xl:px-0">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/basket"
          className="flex items-center justify-center"
          aria-label="Volver al inicio"
        >
          <LuChevronLeft className="w-7.5 h-7.5" />
        </Link>
        <h1 className="text-[28px] lg:text-[40px] leading-12 font-semibold">Checkout</h1>
      </div>

      <CheckoutForm regions={regions} ufValue={ufInfo.value} />
      
      {/* TESTING ONECLICK INSCRIPTION */}
      {/* <OneclickInscriptionButton
        subscriptionPublicId="969fa9ee-79b6-4cb0-950d-25e9ad57e001"
      /> */}
    </div>
  );
};

export default CheckoutPage;
