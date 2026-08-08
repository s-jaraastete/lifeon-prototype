import Link from 'next/link';
import getUF from '@/utils/getUF';

import CheckoutForm from './components/CheckoutForm';

import { getServerData } from '@/lib/requests';

// Icons
import { LuChevronLeft } from 'react-icons/lu';


const CheckoutPage = async () => {
  const ufInfo = await getUF()
  let regions: Region[] = [];

  try {
    const response = await getServerData('/regions/all/?page_size=20', {
      useAccessToken: false,
      cache: 'no-store',
    });

    regions = response?.data?.results ?? [];
  } catch {
    regions = [];
  }

  return (
    <div className="max-w-325 mx-auto py-8 lg:py-12.5 px-4 xl:px-0">
      <div className="flex items-center justify-between gap-3 mb-8">
        <h1 className="text-[28px] lg:text-[40px] leading-12 font-semibold">Checkout</h1>
        <Link
          href="/"
          className="flex items-center justify-center border py-1 px-5 rounded-xl transition duration-200 hover:bg-gray-100"
          aria-label="Volver al inicio"
        >
          <LuChevronLeft className="w-4 h-4 mr-2" />
          Volver
        </Link>
      </div>

      <CheckoutForm regions={regions} ufValue={ufInfo.value} />
    </div>
  );
};

export default CheckoutPage;
