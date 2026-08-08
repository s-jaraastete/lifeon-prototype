import getUF from '@/utils/getUF';
import CartResume from './components/CartResume';

//TODO: Eliminar toda la ruta de basket cuando se confirme que no se utilizará
const BasketPage = async () => {
  const ufInfo = await getUF()
  
  return (
    <>
      <CartResume ufValue={ufInfo.value} />
    </>
  )
};

export default BasketPage;
