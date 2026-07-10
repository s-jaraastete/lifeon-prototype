import getUF from '@/utils/getUF';
import CartResume from './components/CartResume';


const BasketPage = async () => {
  const ufInfo = await getUF()
  
  return (
    <>
      <CartResume ufValue={ufInfo.value} />
    </>
  )
};

export default BasketPage;
